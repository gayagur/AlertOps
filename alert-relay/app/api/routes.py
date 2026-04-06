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
from app.api.schemas import (
    SubscribeRequest, SubscriptionResponse, AlertResponse,
    TestAlertRequest, StatsResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(req: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    """Subscribe to alerts for specific areas."""
    if not req.email and not req.phone and not req.whatsapp:
        raise HTTPException(400, "At least one contact method (email, phone, or whatsapp) is required")

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
    logger.info(f"New subscription {sub.id} for {sub.user_name}: {sub.areas}")
    return sub


@router.get("/subscriptions", response_model=list[SubscriptionResponse])
async def list_subscriptions(db: AsyncSession = Depends(get_db)):
    """List all active subscriptions."""
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


@router.get("/alerts/recent", response_model=list[AlertResponse])
async def recent_alerts(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get the most recent alerts."""
    result = await db.execute(
        select(Alert).order_by(Alert.timestamp.desc()).limit(min(limit, 200))
    )
    return result.scalars().all()


@router.post("/test-alert")
async def test_alert(req: TestAlertRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a test alert to all subscribers matching the given areas.
    This creates a real notification but is clearly marked as a test.
    """
    now = datetime.now(timezone.utc)
    alert_data = {
        "id": f"test-{now.strftime('%Y%m%d%H%M%S')}",
        "timestamp": now.isoformat(),
        "areas": req.areas,
        "alert_type": req.alert_type,
        "title": req.title,
        "source": "AlertOps Test",
        "dedup_hash": compute_dedup_hash(now.isoformat(), req.areas, req.alert_type),
    }

    # Persist test alert
    alert = Alert(
        id=alert_data["id"],
        timestamp=now,
        areas=req.areas,
        alert_type=req.alert_type,
        source="AlertOps Test",
        title=req.title,
        dedup_hash=alert_data["dedup_hash"],
    )
    db.add(alert)
    await db.commit()

    # Match and notify
    matched = await find_matching_subscriptions(db, req.areas)
    total_sent = 0
    for sub in matched:
        logs = await notify_subscriber(db, sub, alert_data)
        total_sent += sum(1 for log in logs if log.status == "sent")

    return {
        "status": "test_sent",
        "matched_subscriptions": len(matched),
        "notifications_sent": total_sent,
        "areas": req.areas,
    }


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """System statistics."""
    from app.workers.poller import _running

    alerts_count = await db.scalar(select(func.count(Alert.id)))
    subs_count = await db.scalar(
        select(func.count(Subscription.id)).where(Subscription.is_active == True)
    )
    notif_count = await db.scalar(
        select(func.count(NotificationLog.id)).where(NotificationLog.status == "sent")
    )

    return StatsResponse(
        total_alerts=alerts_count or 0,
        total_subscriptions=subs_count or 0,
        total_notifications_sent=notif_count or 0,
        poller_active=_running,
    )
