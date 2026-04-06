"""
Notification Service
====================
Sends alerts to subscribers via email, SMS, and WhatsApp.
Each notification is logged with delivery status for audit.

Retry logic uses tenacity for transient failures.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import get_settings
from app.models.notifications import NotificationLog
from app.models.subscriptions import Subscription

logger = logging.getLogger(__name__)

OFFICIAL_INSTRUCTIONS_URL = "https://www.oref.org.il/"


def format_alert_message(alert: dict) -> str:
    """Format an alert into a human-readable notification message."""
    areas = ", ".join(alert.get("areas", [])[:5])
    if len(alert.get("areas", [])) > 5:
        areas += f" (+{len(alert['areas']) - 5} more)"

    timestamp = alert.get("timestamp", "")
    try:
        dt = datetime.fromisoformat(timestamp)
        time_str = dt.strftime("%H:%M %d/%m/%Y")
    except (ValueError, TypeError):
        time_str = timestamp

    title = alert.get("title", "Alert")
    source = alert.get("source", "Home Front Command")

    return (
        f"🔔 {title}\n\n"
        f"Areas: {areas}\n"
        f"Time: {time_str}\n"
        f"Source: {source}\n\n"
        f"Follow official instructions: {OFFICIAL_INSTRUCTIONS_URL}\n\n"
        f"— AlertOps (public safety relay)"
    )


async def send_email(to: str, subject: str, body: str) -> bool:
    """Send email via SendGrid."""
    settings = get_settings()
    if not settings.sendgrid_api_key:
        logger.warning("SendGrid not configured — skipping email")
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=settings.sendgrid_from_email,
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        return 200 <= response.status_code < 300
    except Exception as e:
        logger.error(f"Email send failed to {to}: {e}")
        return False


async def send_sms(to: str, body: str) -> bool:
    """Send SMS via Twilio."""
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio not configured — skipping SMS")
        return False

    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        message = client.messages.create(
            body=body,
            from_=settings.twilio_from_phone,
            to=to,
        )
        return message.status in ("queued", "sent", "delivered")
    except Exception as e:
        logger.error(f"SMS send failed to {to}: {e}")
        return False


async def send_whatsapp(to: str, body: str) -> bool:
    """Send WhatsApp message via Twilio."""
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        logger.warning("Twilio not configured — skipping WhatsApp")
        return False

    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        wa_to = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
        message = client.messages.create(
            body=body,
            from_=settings.twilio_whatsapp_from,
            to=wa_to,
        )
        return message.status in ("queued", "sent", "delivered")
    except Exception as e:
        logger.error(f"WhatsApp send failed to {to}: {e}")
        return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
async def send_with_retry(channel: str, recipient: str, subject: str, body: str) -> bool:
    """Send notification with retry logic."""
    if channel == "email":
        return await send_email(recipient, subject, body)
    elif channel == "sms":
        return await send_sms(recipient, body)
    elif channel == "whatsapp":
        return await send_whatsapp(recipient, body)
    return False


async def notify_subscriber(
    db: AsyncSession,
    sub: Subscription,
    alert: dict,
) -> list[NotificationLog]:
    """
    Send alert to a subscriber via all their configured channels.
    Logs each notification attempt.
    """
    message = format_alert_message(alert)
    subject = f"Alert: {alert.get('title', 'Home Front Command Alert')}"
    alert_id = alert.get("id", "unknown")
    logs = []

    channels = []
    if sub.notify_email and sub.email:
        channels.append(("email", sub.email))
    if sub.notify_sms and sub.phone:
        channels.append(("sms", sub.phone))
    if sub.notify_whatsapp and sub.whatsapp:
        channels.append(("whatsapp", sub.whatsapp))

    for channel, recipient in channels:
        log = NotificationLog(
            alert_id=alert_id,
            subscription_id=sub.id,
            channel=channel,
            recipient=recipient,
            status="pending",
            attempts=0,
        )

        try:
            success = await send_with_retry(channel, recipient, subject, message)
            log.status = "sent" if success else "failed"
            log.attempts = 1
            if success:
                log.sent_at = datetime.now(timezone.utc)
        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)[:500]
            log.attempts = 3
            logger.error(f"All retries failed for {channel} to {recipient}: {e}")

        db.add(log)
        logs.append(log)

    await db.commit()
    return logs
