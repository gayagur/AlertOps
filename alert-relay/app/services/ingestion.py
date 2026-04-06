"""
Alert Ingestion Service
=======================
Polls the official Home Front Command public alerts endpoint,
parses alerts into a normalized format, and checks for duplicates.

Source: Official National Emergency Portal / Home Front Command
The endpoint serves a public JSON array of recent alerts.

CRITICAL: This service ONLY reads publicly available, officially published alerts.
It does NOT predict, anticipate, or forward alerts before official publication.
"""

import hashlib
import logging
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Standard headers to identify as a legitimate client
HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    "Referer": "https://www.oref.org.il/",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "AlertOps-CivilianDashboard/1.0 (public-safety-tool)",
}


def compute_dedup_hash(timestamp: str, areas: list[str], alert_type: str) -> str:
    """
    Create a deterministic hash for deduplication.
    Key = SHA-256(timestamp + sorted areas + alert_type).
    """
    raw = f"{timestamp}|{'|'.join(sorted(areas))}|{alert_type}"
    return hashlib.sha256(raw.encode()).hexdigest()


def normalize_alert(raw: dict) -> dict | None:
    """
    Normalize a raw alert from the official source into a clean format.

    Expected raw format (official endpoint):
    {
      "alertDate": "2026-04-06 02:14:00",
      "title": "ירי רקטות וטילים",
      "data": ["תל אביב - מרכז העיר", "תל אביב - דרום"],
      "category": 1
    }

    Returns normalized dict or None if parsing fails.
    """
    try:
        raw_date = raw.get("alertDate", "")
        title = raw.get("title", "")
        areas = raw.get("data", [])
        category = raw.get("category", 0)

        if not areas or not raw_date:
            return None

        # Parse timestamp
        try:
            ts = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
            ts = ts.replace(tzinfo=timezone.utc)
        except ValueError:
            ts = datetime.now(timezone.utc)

        # Map category to alert type
        alert_type_map = {
            1: "rocket_alert",
            2: "hostile_aircraft",
            3: "earthquake",
            4: "tsunami",
            5: "radiological",
            6: "hazardous_materials",
            7: "terrorist_infiltration",
            13: "missile_alert",
        }
        alert_type = alert_type_map.get(category, "general_alert")

        dedup = compute_dedup_hash(raw_date, areas, alert_type)

        return {
            "id": dedup[:16],
            "timestamp": ts.isoformat(),
            "areas": areas,
            "alert_type": alert_type,
            "title": title,
            "source": "Home Front Command",
            "dedup_hash": dedup,
            "raw_data": raw,
        }
    except Exception as e:
        logger.error(f"Failed to normalize alert: {e}")
        return None


async def fetch_alerts() -> list[dict]:
    """
    Fetch the latest alerts from the official public endpoint.
    Returns a list of normalized alert dicts.
    """
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(settings.alert_source_url, headers=HEADERS)
            resp.raise_for_status()

            raw_alerts = resp.json()
            if not isinstance(raw_alerts, list):
                logger.warning(f"Unexpected response format: {type(raw_alerts)}")
                return []

            normalized = []
            for raw in raw_alerts:
                alert = normalize_alert(raw)
                if alert:
                    normalized.append(alert)

            return normalized

    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP error fetching alerts: {e.response.status_code}")
        return []
    except httpx.RequestError as e:
        logger.warning(f"Request error fetching alerts: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error fetching alerts: {e}")
        return []
