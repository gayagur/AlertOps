from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String, ForeignKey("alerts.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    channel = Column(String(20), nullable=False)  # email, sms, whatsapp
    recipient = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, sent, failed, retrying
    error_message = Column(Text, nullable=True)
    attempts = Column(Integer, default=0)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
