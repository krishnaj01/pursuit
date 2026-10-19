from datetime import datetime

from sqlalchemy import DateTime, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class LogoAsset(TimestampMixin, Base):
    """Logo image cached per domain, shared by all users, so each logo is fetched upstream once.

    A row with `data = NULL` records a failed lookup so we don't retry it on every keystroke.
    """

    __tablename__ = "logo_assets"

    domain: Mapped[str] = mapped_column(String(255), primary_key=True)
    content_type: Mapped[str | None] = mapped_column(String(100))
    data: Mapped[bytes | None] = mapped_column(LargeBinary)
    source: Mapped[str | None] = mapped_column(String(32))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CompanyDomain(TimestampMixin, Base):
    """Cached company-name → domain resolution (from logo.dev brand search or a guess)."""

    __tablename__ = "company_domains"

    lookup_key: Mapped[str] = mapped_column(String(200), primary_key=True)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
