import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)
    timezone: str = Field(default="UTC", max_length=64)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    timezone: str
    created_at: datetime
