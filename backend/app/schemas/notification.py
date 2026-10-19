import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    for_date: date
    application_ids: list[uuid.UUID]
    title: str
    body: str
    read_at: datetime | None
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationOut]
    unread_count: int
