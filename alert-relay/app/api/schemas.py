from pydantic import BaseModel, field_validator
from datetime import datetime
import re


class SubscribeRequest(BaseModel):
    user_name: str
    email: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    areas: list[str]
    notify_email: bool = True
    notify_sms: bool = False
    notify_whatsapp: bool = False

    @field_validator("user_name")
    @classmethod
    def user_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("user_name must not be empty")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        # Basic email format check: something@something.something
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()

    @field_validator("areas")
    @classmethod
    def validate_areas(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one area must be specified")
        # Strip whitespace and reject empty strings
        cleaned = [a.strip() for a in v if a.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty area must be specified")
        if len(cleaned) > 20:
            raise ValueError("Maximum 20 areas allowed per subscription")
        return cleaned

    @field_validator("phone", "whatsapp")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = re.sub(r"[^\d+]", "", v)
        if not cleaned:
            return None
        if not re.match(r"^\+?\d{8,15}$", cleaned):
            raise ValueError("Invalid phone number format. Must be 8-15 digits, optionally starting with +")
        return cleaned


class SubscriptionResponse(BaseModel):
    id: int
    user_name: str
    email: str | None
    phone: str | None
    whatsapp: str | None
    areas: list[str]
    notify_email: bool
    notify_sms: bool
    notify_whatsapp: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: str
    timestamp: datetime
    areas: list[str]
    alert_type: str
    source: str
    title: str | None

    class Config:
        from_attributes = True


class TestAlertRequest(BaseModel):
    areas: list[str]
    alert_type: str = "test_alert"
    title: str = "Test Alert — AlertOps System Test"
    # When False (default), test alerts are stored but notifications are NOT actually sent.
    # Set to True to force real notification dispatch for test alerts.
    send_real_notifications: bool = False

    @field_validator("areas")
    @classmethod
    def validate_areas(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one area must be specified")
        cleaned = [a.strip() for a in v if a.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty area must be specified")
        return cleaned


class StatsResponse(BaseModel):
    total_alerts: int
    total_subscriptions: int
    total_notifications_sent: int
    poller_active: bool
