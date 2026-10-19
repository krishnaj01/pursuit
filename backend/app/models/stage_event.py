import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.application import _str_enum
from app.models.enums import Stage


class StageEvent(TimestampMixin, Base):
    """History of stage transitions, used for timelines and funnel stats."""

    __tablename__ = "stage_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_stage: Mapped[Stage | None] = mapped_column(_str_enum(Stage))
    to_stage: Mapped[Stage] = mapped_column(_str_enum(Stage), nullable=False)
    custom_stage_label: Mapped[str | None] = mapped_column(String(100))
    event_date: Mapped[date | None] = mapped_column(Date)

    application: Mapped["Application"] = relationship(back_populates="stage_events")  # noqa: F821
