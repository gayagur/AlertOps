"""
API Routes
==========
Every response includes freshness metadata:
- generated_at: when this response was computed
- source_last_updated: last time source data changed
- freshness_tier: realtime | near_realtime | aggregated
- stale: whether data may be delayed
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.alerts import Alert
from app.models.subscriptions import Subscription
from app.models.notifications import NotificationLog
from app.services.ingestion import compute_dedup_hash
from app.services.dedup import is_new_alert
from app.services.matcher import find_matching_subscriptions
from app.services.notifier import notify_subscriber
from app.services.aggregator import (
    get_overview_stats, get_region_stats, get_time_series,
    get_hourly_heatmap, get_recent_incidents,
)
from app.services.system_status import metrics
from app.api.schemas import (
    SubscribeRequest, SubscriptionResponse, AlertResponse,
    TestAlertRequest, StatsResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


def freshness_envelope(data, tier: str, source: str = "Home Front Command") -> dict:
    """Wrap response data with freshness metadata."""
    now = datetime.now(timezone.utc)
    source_updated = metrics.last_db_write or metrics.last_successful_poll

    # Determine staleness based on tier
    stale = False
    if tier == "realtime" and not metrics.is_polling_healthy():
        stale = True
    elif tier == "near_realtime" and source_updated:
        age = (now - source_updated).total_seconds()
        stale = age > 120
    elif tier == "aggregated" and source_updated:
        age = (now - source_updated).total_seconds()
        stale = age > 600

    return {
        "generated_at": now.isoformat(),
        "source_last_updated": source_updated.isoformat() if source_updated else None,
        "freshness_tier": tier,
        "source": source,
        "stale": stale,
        "data": data,
    }


# ─── Tier 1: Real-time (5s refresh) ───────────────────────────────

@router.get("/alerts/live")
async def live_alerts(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Live alert feed — Tier 1, frontend refetches every 5s."""
    data = await get_recent_incidents(db, limit)
    return freshness_envelope(data, "realtime")


@router.get("/alerts/recent", response_model=list[AlertResponse])
async def recent_alerts(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Recent alerts (flat response for backward compat)."""
    result = await db.execute(
        select(Alert).order_by(Alert.timestamp.desc()).limit(min(limit, 200))
    )
    return result.scalars().all()


# ─── Tier 2: Near real-time (30s refresh) ──────────────────────────

@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db)):
    """Overview KPIs — Tier 2, frontend refetches every 30s."""
    data = await get_overview_stats(db)
    return freshness_envelope(data, "near_realtime")


@router.get("/regions")
async def regions(db: AsyncSession = Depends(get_db)):
    """Per-region stats — Tier 2, frontend refetches every 30-60s."""
    data = await get_region_stats(db)
    return freshness_envelope(data, "near_realtime")


# ─── Tier 3: Aggregated (2-5min refresh) ──────────────────────────

@router.get("/timeseries")
async def timeseries(days: int = 14, db: AsyncSession = Depends(get_db)):
    """Daily alert time series — Tier 3, frontend refetches every 2-5min."""
    data = await get_time_series(db, days)
    metrics.record_aggregation()
    return freshness_envelope(data, "aggregated")


@router.get("/heatmap")
async def heatmap(days: int = 7, db: AsyncSession = Depends(get_db)):
    """Region x Hour heatmap — Tier 3, frontend refetches every 2-5min."""
    data = await get_hourly_heatmap(db, days)
    metrics.record_aggregation()
    return freshness_envelope(data, "aggregated")


# ─── System Status ────────────────────────────────────────────────

@router.get("/system/status")
async def system_status():
    """Internal observability endpoint."""
    return metrics.to_dict()


# ─── Subscriptions ────────────────────────────────────────────────

@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(req: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    """Subscribe to alerts for specific areas."""
    if not req.email and not req.phone and not req.whatsapp:
        raise HTTPException(400, "At least one contact method required")

    # Duplicate subscription check: same email + same areas (sorted) = reject
    if req.email:
        sorted_new_areas = sorted([a.lower().strip() for a in req.areas])
        result = await db.execute(
            select(Subscription).where(
                Subscription.email == req.email,
                Subscription.is_active == True,
            )
        )
        existing_subs = result.scalars().all()
        for existing in existing_subs:
            sorted_existing_areas = sorted([a.lower().strip() for a in (existing.areas or [])])
            if sorted_existing_areas == sorted_new_areas:
                raise HTTPException(
                    409,
                    f"A subscription with this email and the same areas already exists (id={existing.id})"
                )

    sub = Subscription(
        user_name=req.user_name,
        email=req.email,
        phone=req.phone,
        whatsapp=req.whatsapp,
        areas=req.areas,
        notify_email=req.notify_email,
        notify_sms=req.notify_sms,
        notify_whatsapp=req.notify_whatsapp,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.get("/subscriptions", response_model=list[SubscriptionResponse])
async def list_subscriptions(db: AsyncSession = Depends(get_db)):
    """List active subscriptions."""
    result = await db.execute(
        select(Subscription).where(Subscription.is_active == True).order_by(Subscription.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/subscriptions/{sub_id}")
async def deactivate_subscription(sub_id: int, db: AsyncSession = Depends(get_db)):
    """Deactivate a subscription."""
    result = await db.execute(select(Subscription).where(Subscription.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub.is_active = False
    await db.commit()
    return {"status": "deactivated", "id": sub_id}


@router.post("/test-alert")
async def test_alert(req: TestAlertRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a test alert to matching subscribers.

    By default, notifications are NOT actually dispatched (test_mode).
    They are logged with status "test_skipped" for safety.

    Set send_real_notifications=true in the request body to force real dispatch.
    """
    now = datetime.now(timezone.utc)

    # Ensure test alert_type is prefixed with "test_"
    alert_type = req.alert_type
    if not alert_type.startswith("test_"):
        alert_type = f"test_{alert_type}"

    alert_data = {
        "id": f"test-{now.strftime('%Y%m%d%H%M%S')}",
        "timestamp": now.isoformat(),
        "areas": req.areas,
        "alert_type": alert_type,
        "title": req.title,
        "source": "AlertOps Test",
        "dedup_hash": compute_dedup_hash(now.isoformat(), req.areas, alert_type),
    }

    alert = Alert(
        id=alert_data["id"], timestamp=now, areas=req.areas,
        alert_type=alert_type, source="AlertOps Test",
        title=req.title, dedup_hash=alert_data["dedup_hash"],
    )
    db.add(alert)
    await db.commit()

    matched = await find_matching_subscriptions(db, req.areas)
    total_sent = 0
    total_skipped = 0
    for sub in matched:
        logs = await notify_subscriber(db, sub, alert_data, send_real=req.send_real_notifications)
        for log in logs:
            if log.status == "sent":
                total_sent += 1
            elif log.status == "test_skipped":
                total_skipped += 1

    mode = "live" if req.send_real_notifications else "test_mode (no real dispatch)"
    return {
        "status": "test_sent",
        "mode": mode,
        "matched": len(matched),
        "sent": total_sent,
        "skipped": total_skipped,
    }


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """System statistics."""
    return StatsResponse(
        total_alerts=await db.scalar(select(func.count(Alert.id))) or 0,
        total_subscriptions=await db.scalar(
            select(func.count(Subscription.id)).where(Subscription.is_active == True)
        ) or 0,
        total_notifications_sent=await db.scalar(
            select(func.count(NotificationLog.id)).where(NotificationLog.status == "sent")
        ) or 0,
        poller_active=metrics.poller_running,
    )
