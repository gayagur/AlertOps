from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    areas = Column(JSON, nullable=False)  # list of area strings
    alert_type = Column(String(50), nullable=False)
    source = Column(String(100), nullable=False, default="Home Front Command")
    title = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    dedup_hash = Column(String(64), unique=True, nullable=False, index=True)
