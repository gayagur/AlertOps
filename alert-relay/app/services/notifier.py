"""
Notification Service
====================
Sends alerts to subscribers via email, SMS, and WhatsApp.
Each notification is logged with delivery status for audit.

Features:
- Idempotency: checks notification_logs before sending to prevent double-sends
- Test mode: alerts with source="AlertOps Test" skip real dispatch unless explicitly requested
- Retry logic uses tenacity for transient failures
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import get_settings
from app.models.notifications import NotificationLog
from app.models.subscriptions import Subscription
from app.services.system_status import metrics

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


async def _already_sent(db: AsyncSession, alert_id: str, subscription_id: int, channel: str) -> bool:
    """
    Idempotency check: return True if a notification for this (alert, subscription, channel)
    combination has already been sent successfully.
    """
    result = await db.execute(
        select(NotificationLog).where(
            and_(
                NotificationLog.alert_id == alert_id,
                NotificationLog.subscription_id == subscription_id,
                NotificationLog.channel == channel,
                NotificationLog.status.in_(["sent", "test_skipped"]),
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def notify_subscriber(
    db: AsyncSession,
    sub: Subscription,
    alert: dict,
    send_real: bool = True,
) -> list[NotificationLog]:
    """
    Send alert to a subscriber via all their configured channels.
    Logs each notification attempt.

    If the alert source is "AlertOps Test" and send_real is False,
    notifications are logged as "test_skipped" instead of actually sent.

    Idempotency: skips channels where a notification was already sent.
    """
    is_test_alert = alert.get("source") == "AlertOps Test"
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
        # Idempotency check: skip if already sent for this combination
        if await _already_sent(db, alert_id, sub.id, channel):
            logger.info(f"Skipping duplicate notification: alert={alert_id} sub={sub.id} channel={channel}")
            continue

        log = NotificationLog(
            alert_id=alert_id,
            subscription_id=sub.id,
            channel=channel,
            recipient=recipient,
            status="pending",
            attempts=0,
        )

        # Test alert safety: skip real dispatch unless explicitly requested
        if is_test_alert and not send_real:
            log.status = "test_skipped"
            log.attempts = 0
            logger.info(f"Test alert — skipping real {channel} notification to {recipient}")
        else:
            try:
                success = await send_with_retry(channel, recipient, subject, message)
                log.status = "sent" if success else "failed"
                log.attempts = 1
                if success:
                    log.sent_at = datetime.now(timezone.utc)
                    metrics.record_notification_dispatch()
            except Exception as e:
                log.status = "failed"
                log.error_message = str(e)[:500]
                log.attempts = 3
                logger.error(f"All retries failed for {channel} to {recipient}: {e}")

        metrics.record_notification(log.status in ("sent", "test_skipped"))
        db.add(log)
        logs.append(log)

    await db.commit()
    return logs
