"""
Deduplication Service
=====================
Uses Redis with TTL to prevent duplicate alert processing.
Each alert is identified by its dedup_hash (SHA-256 of timestamp + areas + type).
"""

import logging

from app.core.redis import get_redis
from app.core.config import get_settings

logger = logging.getLogger(__name__)

DEDUP_PREFIX = "alertops:dedup:"


async def is_duplicate(dedup_hash: str) -> bool:
    """Check if an alert with this hash has already been processed."""
    r = await get_redis()
    key = f"{DEDUP_PREFIX}{dedup_hash}"
    return await r.exists(key) > 0


async def mark_processed(dedup_hash: str):
    """Mark an alert as processed with TTL expiry."""
    settings = get_settings()
    r = await get_redis()
    key = f"{DEDUP_PREFIX}{dedup_hash}"
    await r.setex(key, settings.dedup_ttl, "1")


async def is_new_alert(dedup_hash: str) -> bool:
    """
    Atomic check-and-set: returns True if the alert is new, False if duplicate.
    Uses SET NX (set if not exists) for atomicity.
    """
    settings = get_settings()
    r = await get_redis()
    key = f"{DEDUP_PREFIX}{dedup_hash}"
    result = await r.set(key, "1", ex=settings.dedup_ttl, nx=True)
    return result is True
