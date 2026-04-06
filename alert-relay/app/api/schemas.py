from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal
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

    @field_validator("areas")
    @classmethod
    def areas_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one area must be specified")
        return [a.strip() for a in v if a.strip()]

    @field_validator("phone", "whatsapp")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = re.sub(r"[^\d+]", "", v)
        if cleaned and not re.match(r"^\+?\d{8,15}$", cleaned):
            raise ValueError("Invalid phone number format")
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


class StatsResponse(BaseModel):
    total_alerts: int
    total_subscriptions: int
    total_notifications_sent: int
    poller_active: bool
