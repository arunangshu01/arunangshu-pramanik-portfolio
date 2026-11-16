import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Links are the main spam vector and aren't needed for a short note.
LINK_PATTERN = re.compile(r"(https?://|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|ru|top|link)\b)", re.I)
CONTROL_PATTERN = re.compile(r"[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e]")


class GuestbookEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=60)
    message: str = Field(min_length=1, max_length=280)
    # Honeypot: hidden in the UI, so only bots fill it in.
    website: str = Field(default="", max_length=200)

    @field_validator("name", "message")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = CONTROL_PATTERN.sub("", value).strip()
        if not value:
            raise ValueError("field must not be blank")
        if LINK_PATTERN.search(value):
            raise ValueError("links are not allowed")
        return value

    @field_validator("name")
    @classmethod
    def single_line(cls, value: str) -> str:
        return " ".join(value.split())


class GuestbookPublicEntry(BaseModel):
    id: str
    name: str
    message: str
    created_at: str


class GuestbookPostSuccess(BaseModel):
    message: str
    entry: GuestbookPublicEntry | None = None


class GuestbookList(BaseModel):
    entries: list[GuestbookPublicEntry]
