"""
System Status / Observability
=============================
Tracks internal health metrics for the live monitoring pipeline.
"""

import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class SystemMetrics:
    last_successful_poll: datetime | None = None
    last_failed_poll: datetime | None = None
    last_db_write: datetime | None = None
    last_aggregation_run: datetime | None = None
    last_notification_dispatch: datetime | None = None
    total_polls: int = 0
    total_poll_failures: int = 0
    total_alerts_ingested: int = 0
    total_duplicates_ignored: int = 0
    total_notifications_sent: int = 0
    total_notification_failures: int = 0
    poller_running: bool = False

    def record_poll_success(self):
        self.last_successful_poll = datetime.now(timezone.utc)
        self.total_polls += 1

    def record_poll_failure(self):
        self.last_failed_poll = datetime.now(timezone.utc)
        self.total_polls += 1
        self.total_poll_failures += 1

    def record_ingestion(self, count: int):
        self.total_alerts_ingested += count
        self.last_db_write = datetime.now(timezone.utc)

    def record_duplicate(self):
        self.total_duplicates_ignored += 1

    def record_notification(self, success: bool):
        if success:
            self.total_notifications_sent += 1
        else:
            self.total_notification_failures += 1

    def record_notification_dispatch(self):
        """Record the timestamp of the last real notification dispatch."""
        self.last_notification_dispatch = datetime.now(timezone.utc)

    def record_aggregation(self):
        self.last_aggregation_run = datetime.now(timezone.utc)

    def is_polling_healthy(self) -> bool:
        if not self.last_successful_poll:
            return False
        age = (datetime.now(timezone.utc) - self.last_successful_poll).total_seconds()
        return age < 30  # Healthy if polled in last 30s

    def is_data_fresh(self) -> bool:
        if not self.last_db_write:
            return False
        age = (datetime.now(timezone.utc) - self.last_db_write).total_seconds()
        return age < 120  # Fresh if written in last 2min

    def to_dict(self) -> dict:
        now = datetime.now(timezone.utc)

        def age_seconds(ts: datetime | None) -> float | None:
            return round((now - ts).total_seconds(), 1) if ts else None

        def iso(ts: datetime | None) -> str | None:
            return ts.isoformat() if ts else None

        return {
            "polling": {
                "healthy": self.is_polling_healthy(),
                "running": self.poller_running,
                "last_success": iso(self.last_successful_poll),
                "last_success_age_seconds": age_seconds(self.last_successful_poll),
                "last_failure": iso(self.last_failed_poll),
                "total_polls": self.total_polls,
                "total_failures": self.total_poll_failures,
            },
            "data": {
                "fresh": self.is_data_fresh(),
                "last_write": iso(self.last_db_write),
                "last_write_age_seconds": age_seconds(self.last_db_write),
                "total_ingested": self.total_alerts_ingested,
                "total_duplicates": self.total_duplicates_ignored,
            },
            "aggregation": {
                "last_run": iso(self.last_aggregation_run),
                "last_run_age_seconds": age_seconds(self.last_aggregation_run),
            },
            "notifications": {
                "total_sent": self.total_notifications_sent,
                "total_failures": self.total_notification_failures,
                "last_dispatch": iso(self.last_notification_dispatch),
                "last_dispatch_age_seconds": age_seconds(self.last_notification_dispatch),
            },
            "generated_at": now.isoformat(),
        }


# Global singleton
metrics = SystemMetrics()
