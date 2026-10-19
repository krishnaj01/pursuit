from datetime import date

from pydantic import BaseModel

from app.models.enums import Stage


class StageCount(BaseModel):
    stage: Stage
    count: int


class WeeklyCount(BaseModel):
    week_start: date
    count: int


class UpcomingEvent(BaseModel):
    application_id: str
    company_name: str
    role: str
    stage: Stage
    custom_stage_label: str | None
    event_date: date


class StatsOut(BaseModel):
    total: int
    active: int
    rejected: int
    offers: int
    interviewing: int
    due_today: int
    response_rate: float
    offer_rate: float
    by_stage: list[StageCount]
    weekly: list[WeeklyCount]
    upcoming_events: list[UpcomingEvent]
