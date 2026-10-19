import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ReminderKind, Stage


def _str_enum(enum_cls: type) -> Enum:
    # Stored as plain strings so new stages don't require a Postgres ENUM migration.
    return Enum(
        enum_cls,
        native_enum=False,
        length=32,
        values_callable=lambda members: [m.value for m in members],
    )


class Application(TimestampMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (Index("ix_applications_user_reminder", "user_id", "next_reminder_on"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    company_domain: Mapped[str | None] = mapped_column(String(255))
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    role: Mapped[str] = mapped_column(String(200), nullable=False)
    applied_on: Mapped[date] = mapped_column(Date, nullable=False)

    stage: Mapped[Stage] = mapped_column(_str_enum(Stage), nullable=False, default=Stage.APPLIED)
    custom_stage_label: Mapped[str | None] = mapped_column(String(100))
    event_date: Mapped[date | None] = mapped_column(Date)

    next_reminder_on: Mapped[date | None] = mapped_column(Date)
    reminder_kind: Mapped[ReminderKind] = mapped_column(
        _str_enum(ReminderKind), nullable=False, default=ReminderKind.STATUS_CHECK
    )
    notes: Mapped[str | None] = mapped_column(Text)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="applications")  # noqa: F821
    stage_events: Mapped[list["StageEvent"]] = relationship(  # noqa: F821
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="StageEvent.created_at",
    )
