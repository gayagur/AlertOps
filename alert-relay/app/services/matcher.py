"""
Matching Engine
===============
When a new alert arrives, finds all subscriptions whose areas
overlap with the alert's areas.

Matching is case-insensitive and supports partial matching:
- A subscription to "תל אביב" matches "תל אביב - מרכז העיר"
- A subscription to "Gush Dan" matches if the area contains "Gush Dan"
"""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscriptions import Subscription

logger = logging.getLogger(__name__)


def areas_overlap(sub_areas: list[str], alert_areas: list[str]) -> bool:
    """
    Check if any subscription area matches any alert area.
    Uses case-insensitive substring matching for flexibility.
    """
    for sub_area in sub_areas:
        sub_lower = sub_area.lower().strip()
        for alert_area in alert_areas:
            alert_lower = alert_area.lower().strip()
            if sub_lower in alert_lower or alert_lower in sub_lower:
                return True
    return False


async def find_matching_subscriptions(
    db: AsyncSession, alert_areas: list[str]
) -> list[Subscription]:
    """
    Find all active subscriptions that match the given alert areas.
    Returns list of Subscription objects with notification preferences.
    """
    result = await db.execute(
        select(Subscription).where(Subscription.is_active == True)
    )
    all_subs = result.scalars().all()

    matched = []
    for sub in all_subs:
        if areas_overlap(sub.areas, alert_areas):
            matched.append(sub)

    logger.info(f"Matched {len(matched)} subscriptions for areas: {alert_areas[:3]}...")
    return matched
