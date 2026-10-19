import uuid
from datetime import date

from sqlalchemy import Date, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    google_sub: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1024))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    # The user's local date when today's reminder digest was last built (first visit of the day).
    last_digest_check_on: Mapped[date | None] = mapped_column(Date)

    applications: Mapped[list["Application"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
