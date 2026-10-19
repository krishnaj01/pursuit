import re
import uuid
from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.models.enums import CLOSED_STAGES, FOLLOW_UP_STAGES, ReminderKind, Stage

# Stages that don't come with a dated event (OA date, interview date, deadline...).
UNDATED_STAGES = FOLLOW_UP_STAGES | CLOSED_STAGES

CompanyName = Annotated[str, Field(min_length=1, max_length=200)]
Role = Annotated[str, Field(min_length=1, max_length=200)]
Domain = Annotated[str, Field(max_length=255, pattern=r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")]


CACHED_LOGO_PATH = re.compile(r"^/api/v1/logos/image/[a-zA-Z0-9.-]+$")


JOB_URL_MAX_LENGTH = 2048


def _clean_job_url(value: str | None) -> str | None:
    """Job posting links must be absolute http(s) URLs."""
    if value is None or not value.strip():
        return None
    url = str(HttpUrl(value.strip()))
    if len(url) > JOB_URL_MAX_LENGTH:
        raise ValueError("The job URL is too long")
    return url


def _clean_url(value: str | None) -> str | None:
    """Accept an absolute http(s) image URL or a path to our own cached logo."""
    if value is None or value == "":
        return None
    if CACHED_LOGO_PATH.match(value):
        return value
    return str(HttpUrl(value))


class ApplicationFilter(StrEnum):
    ALL = "all"
    DUE = "due"
    UPCOMING = "upcoming"
    CLOSED = "closed"


class ApplicationCreate(BaseModel):
    company_name: CompanyName
    company_domain: Domain | None = None
    logo_url: str | None = None
    role: Role
    applied_on: date
    # First status-check reminder, counted from the day it's added to the app
    # (`reminder_days`) or an exact custom date (`reminder_on`). Omit both for no reminder.
    reminder_days: int | None = Field(default=None, ge=0, le=365)
    reminder_on: date | None = None
    job_url: str | None = None
    notes: str | None = Field(default=None, max_length=5000)

    _validate_logo = field_validator("logo_url")(classmethod(lambda cls, v: _clean_url(v)))
    _validate_job_url = field_validator("job_url")(classmethod(lambda cls, v: _clean_job_url(v)))

    @model_validator(mode="after")
    def at_most_one_reminder_choice(self) -> Self:
        if self.reminder_days is not None and self.reminder_on is not None:
            raise ValueError("Provide only one of `reminder_days` or `reminder_on`")
        return self


class ApplicationUpdate(BaseModel):
    """Partial update. Sending `logo_url: null` explicitly removes the logo."""

    company_name: CompanyName | None = None
    company_domain: Domain | None = None
    logo_url: str | None = None
    role: Role | None = None
    applied_on: date | None = None
    job_url: str | None = None
    notes: str | None = Field(default=None, max_length=5000)

    _validate_logo = field_validator("logo_url")(classmethod(lambda cls, v: _clean_url(v)))
    _validate_job_url = field_validator("job_url")(classmethod(lambda cls, v: _clean_job_url(v)))


class StageUpdate(BaseModel):
    stage: Stage
    custom_stage_label: str | None = Field(default=None, max_length=100)
    event_date: date | None = None
    # Set false to record the event date without being reminded about it.
    remind: bool = True
    # Follow-up stages (Applied, Awaiting) may schedule the next check-in in the same request.
    follow_up_days: int | None = Field(default=None, ge=1, le=365)
    follow_up_on: date | None = None

    @model_validator(mode="after")
    def check_requirements(self) -> Self:
        if self.follow_up_days is not None or self.follow_up_on is not None:
            if self.stage not in FOLLOW_UP_STAGES:
                raise ValueError("Follow-up reminders only apply to Applied or Awaiting")
            if self.follow_up_days is not None and self.follow_up_on is not None:
                raise ValueError("Provide only one of `follow_up_days` or `follow_up_on`")
        if self.stage == Stage.CUSTOM and not (self.custom_stage_label or "").strip():
            raise ValueError("A label is required for a custom stage")
        if self.stage not in UNDATED_STAGES and self.event_date is None:
            raise ValueError("An event date is required for this stage")
        if self.stage != Stage.CUSTOM:
            self.custom_stage_label = None
        return self


class ReminderUpdate(BaseModel):
    """Schedule the next status-check reminder: either `days` from today or an exact `on_date`."""

    days: int | None = Field(default=None, ge=1, le=365)
    on_date: date | None = None

    @model_validator(mode="after")
    def exactly_one(self) -> Self:
        if (self.days is None) == (self.on_date is None):
            raise ValueError("Provide exactly one of `days` or `on_date`")
        return self


class StageEventUpdate(BaseModel):
    """Partial edit of a timeline entry. The stage itself isn't editable — delete and re-add."""

    occurred_on: date | None = None
    event_date: date | None = None
    custom_stage_label: str | None = Field(default=None, max_length=100)


class StageEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_stage: Stage | None
    to_stage: Stage
    custom_stage_label: str | None
    event_date: date | None
    occurred_on: date
    created_at: datetime


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_name: str
    company_domain: str | None
    logo_url: str | None
    role: str
    applied_on: date
    stage: Stage
    custom_stage_label: str | None
    event_date: date | None
    next_reminder_on: date | None
    reminder_kind: ReminderKind
    job_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
