"""
Alert Poller Worker
===================
Background task that polls the official alert source every N seconds,
deduplicates, persists, matches subscribers, and sends notifications.

Pipeline: Fetch → Normalize → Dedup → Persist → Match → Notify → Log
"""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session
from app.models.alerts import Alert
from app.services.ingestion import fetch_alerts
from app.services.dedup import is_new_alert
from app.services.matcher import find_matching_subscriptions
from app.services.notifier import notify_subscriber
from app.services.system_status import metrics

logger = logging.getLogger(__name__)

_running = False


async def process_alert(db: AsyncSession, alert_data: dict):
    """Process a single new alert: persist, match, notify."""
    alert = Alert(
        id=alert_data["id"],
        timestamp=datetime.fromisoformat(alert_data["timestamp"]),
        areas=alert_data["areas"],
        alert_type=alert_data["alert_type"],
        source=alert_data["source"],
        title=alert_data.get("title"),
        raw_data=alert_data.get("raw_data"),
        dedup_hash=alert_data["dedup_hash"],
    )
    db.add(alert)
    await db.commit()
    metrics.record_ingestion(1)
    logger.info(f"Persisted alert {alert.id}: {alert.title} in {len(alert.areas)} areas")

    matched_subs = await find_matching_subscriptions(db, alert_data["areas"])
    if not matched_subs:
        return

    for sub in matched_subs:
        logs = await notify_subscriber(db, sub, alert_data)
        for log in logs:
            metrics.record_notification(log.status == "sent")


async def poll_cycle():
    """Run one polling cycle: fetch, dedup, process new alerts."""
    try:
        alerts = await fetch_alerts()
        metrics.record_poll_success()

        if not alerts:
            return

        new_count = 0
        async with async_session() as db:
            for alert_data in alerts:
                if await is_new_alert(alert_data["dedup_hash"]):
                    new_count += 1
                    try:
                        await process_alert(db, alert_data)
                    except Exception as e:
                        logger.error(f"Failed to process alert {alert_data['id']}: {e}")
                        await db.rollback()
                else:
                    metrics.record_duplicate()

        if new_count > 0:
            logger.info(f"Processed {new_count} new alerts")

    except Exception as e:
        metrics.record_poll_failure()
        logger.error(f"Poll cycle error: {e}")


async def start_polling():
    """Start the continuous polling loop."""
    global _running
    settings = get_settings()
    _running = True
    metrics.poller_running = True
    logger.info(f"Starting alert poller (interval: {settings.poll_interval_seconds}s)")

    while _running:
        await poll_cycle()
        await asyncio.sleep(settings.poll_interval_seconds)


def stop_polling():
    """Signal the polling loop to stop."""
    global _running
    _running = False
    metrics.poller_running = False
    logger.info("Alert poller stopping")
