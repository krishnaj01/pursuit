import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.application import _str_enum
from app.models.enums import Stage


class StageEvent(Base):
    """Timeline of stage transitions, used for the editable history and funnel stats.

    Entries are ordered by insertion (`created_at`); the newest one mirrors the
    application's current stage.
    """

    __tablename__ = "stage_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_stage: Mapped[Stage | None] = mapped_column(_str_enum(Stage))
    to_stage: Mapped[Stage] = mapped_column(_str_enum(Stage), nullable=False)
    custom_stage_label: Mapped[str | None] = mapped_column(String(100))
    event_date: Mapped[date | None] = mapped_column(Date)
    # When the transition happened (user-editable); defaults to the day it was logged.
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False)
    # Python-side default gives microsecond precision so entries in one transaction keep order.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )

    application: Mapped["Application"] = relationship(back_populates="stage_events")  # noqa: F821
