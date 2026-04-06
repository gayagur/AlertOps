"""Initial schema — alerts, subscriptions, notification_logs

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-04-04 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Alerts table ────────────────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("areas", sa.JSON(), nullable=False),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("source", sa.String(100), nullable=False, server_default="Home Front Command"),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("dedup_hash", sa.String(64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_timestamp", "alerts", ["timestamp"])
    op.create_index("ix_alerts_dedup_hash", "alerts", ["dedup_hash"], unique=True)

    # ─── Subscriptions table ─────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("whatsapp", sa.String(20), nullable=True),
        sa.Column("areas", sa.JSON(), nullable=False),
        sa.Column("notify_email", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("notify_sms", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("notify_whatsapp", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    # ─── Notification logs table ─────────────────────────────────────
    op.create_table(
        "notification_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alert_id", sa.String(), nullable=False),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("recipient", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0")),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["alert_id"], ["alerts.id"]),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"]),
    )
    op.create_index("ix_notification_logs_alert_id", "notification_logs", ["alert_id"])
    op.create_index("ix_notification_logs_subscription_id", "notification_logs", ["subscription_id"])
    # Unique constraint to prevent duplicate notifications (idempotency)
    op.create_unique_constraint(
        "uq_notification_alert_sub_channel",
        "notification_logs",
        ["alert_id", "subscription_id", "channel"],
    )


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("subscriptions")
    op.drop_table("alerts")
