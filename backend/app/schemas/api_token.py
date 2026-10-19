import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApiTokenCreate(BaseModel):
    name: str = Field(default="Browser extension", min_length=1, max_length=100)


class ApiTokenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    prefix: str
    created_at: datetime
    last_used_at: datetime | None


class ApiTokenCreated(ApiTokenOut):
    # The plaintext token — returned only once, at creation.
    token: str
