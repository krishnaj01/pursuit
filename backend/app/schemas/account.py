from pydantic import BaseModel, Field


class DeleteAccountRequest(BaseModel):
    """The user re-types their email to confirm a permanent deletion."""

    confirm_email: str = Field(min_length=3, max_length=320)
