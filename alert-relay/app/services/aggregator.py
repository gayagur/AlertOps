"""
Aggregation Service
===================
Computes derived metrics from stored alert data.
Each function queries Postgres and returns fresh aggregated results.

Freshness tiers:
- Tier 1 (5s): raw alert feed — no aggregation needed, direct DB reads
- Tier 2 (30s): 24h/7d counters, most affected region, recent summaries
- Tier 3 (2-5min): heatmaps, distributions, trend lines, rolling averages
"""

import logging
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alerts import Alert

logger = logging.getLogger(__name__)


async def get_overview_stats(db: AsyncSession) -> dict:
    """Tier 2 — Overview KPIs, refreshed every 30s."""
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    week_ago = now - timedelta(days=7)

    total = await db.scalar(select(func.count(Alert.id))) or 0
    last_24h = await db.scalar(
        select(func.count(Alert.id)).where(Alert.timestamp >= day_ago)
    ) or 0
    last_7d = await db.scalar(
        select(func.count(Alert.id)).where(Alert.timestamp >= week_ago)
    ) or 0

    # Most affected region (from areas JSON — approximate by counting alerts)
    result = await db.execute(
        select(Alert.areas, Alert.timestamp)
        .where(Alert.timestamp >= week_ago)
        .order_by(Alert.timestamp.desc())
    )
    rows = result.all()

    region_counts: dict[str, int] = defaultdict(int)
    hour_counts: dict[int, int] = defaultdict(int)
    for areas, ts in rows:
        if isinstance(areas, list):
            for area in areas:
                region_counts[area] += 1
        if ts:
            hour_counts[ts.hour] += 1

    most_affected = max(region_counts, key=region_counts.get, default="N/A") if region_counts else "N/A"
    peak_hour = max(hour_counts, key=hour_counts.get, default=0) if hour_counts else 0

    # Last alert timestamp
    last_alert = await db.scalar(
        select(func.max(Alert.timestamp))
    )

    return {
        "total_alerts": total,
        "last_24h_alerts": last_24h,
        "last_7d_alerts": last_7d,
        "most_affected_region": most_affected,
        "peak_activity_hour": peak_hour,
        "last_alert_at": last_alert.isoformat() if last_alert else None,
        "computed_at": now.isoformat(),
    }


async def get_region_stats(db: AsyncSession) -> list[dict]:
    """Tier 2/3 — Per-region statistics, refreshed every 30-60s."""
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    week_ago = now - timedelta(days=7)

    result = await db.execute(
        select(Alert.areas, Alert.timestamp, Alert.alert_type)
        .where(Alert.timestamp >= week_ago)
    )
    rows = result.all()

    stats: dict[str, dict] = defaultdict(lambda: {
        "alerts": 0, "last_24h": 0, "last_7d": 0,
        "hour_counts": defaultdict(int),
    })

    for areas, ts, alert_type in rows:
        if not isinstance(areas, list):
            continue
        for area in areas:
            s = stats[area]
            s["alerts"] += 1
            s["last_7d"] += 1
            if ts and ts >= day_ago:
                s["last_24h"] += 1
            if ts:
                s["hour_counts"][ts.hour] += 1

    result_list = []
    for region, s in sorted(stats.items(), key=lambda x: x[1]["alerts"], reverse=True):
        peak = max(s["hour_counts"], key=s["hour_counts"].get, default=0) if s["hour_counts"] else 0
        result_list.append({
            "region": region,
            "alerts": s["alerts"],
            "last_24h": s["last_24h"],
            "last_7d": s["last_7d"],
            "peak_hour": peak,
        })

    return result_list[:20]  # Top 20 regions


async def get_time_series(db: AsyncSession, days: int = 14) -> list[dict]:
    """Tier 3 — Daily alert counts for trend charts, refreshed every 2-5min."""
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    result = await db.execute(
        select(Alert.timestamp)
        .where(Alert.timestamp >= start)
        .order_by(Alert.timestamp.asc())
    )
    rows = result.scalars().all()

    daily: dict[str, int] = defaultdict(int)
    for ts in rows:
        if ts:
            day_key = ts.strftime("%Y-%m-%d")
            daily[day_key] += 1

    return [{"date": d, "alerts": c} for d, c in sorted(daily.items())]


async def get_hourly_heatmap(db: AsyncSession, days: int = 7) -> list[dict]:
    """Tier 3 — Region x Hour heatmap, refreshed every 2-5min."""
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    result = await db.execute(
        select(Alert.areas, Alert.timestamp)
        .where(Alert.timestamp >= start)
    )
    rows = result.all()

    heatmap: dict[tuple[str, int], int] = defaultdict(int)
    for areas, ts in rows:
        if not isinstance(areas, list) or not ts:
            continue
        for area in areas:
            heatmap[(area, ts.hour)] += 1

    # Get top regions by total count
    region_totals: dict[str, int] = defaultdict(int)
    for (region, _), count in heatmap.items():
        region_totals[region] += count
    top_regions = sorted(region_totals, key=region_totals.get, reverse=True)[:10]

    cells = []
    for region in top_regions:
        for hour in range(24):
            cells.append({
                "region": region,
                "hour": hour,
                "value": heatmap.get((region, hour), 0),
            })

    return cells


async def get_recent_incidents(db: AsyncSession, limit: int = 20) -> list[dict]:
    """Tier 1 — Most recent alerts for live feed, refreshed every 5s."""
    result = await db.execute(
        select(Alert).order_by(Alert.timestamp.desc()).limit(limit)
    )
    alerts = result.scalars().all()

    return [
        {
            "id": a.id,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "areas": a.areas or [],
            "alert_type": a.alert_type,
            "title": a.title,
            "source": a.source,
            "source_type": "official",
            "confidence": "official",
        }
        for a in alerts
    ]
