from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://localhost:5432/alertops"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Alert source
    alert_source_url: str = "https://www.oref.org.il/warningMessages/alert/History/AlertsHistory.json"
    poll_interval_seconds: int = 3

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "alerts@alertops.app"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_phone: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    # Security
    api_secret_key: str = "change-me"

    # Dedup TTL (seconds) — alerts older than this are removed from Redis
    dedup_ttl: int = 3600

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
