from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

StatusKind = Literal["building", "reading", "learning", "exploring", "listening"]


class NowStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: StatusKind
    label: str = Field(min_length=1, max_length=120)
    url: Optional[str] = Field(default=None, max_length=256)
    updated_at: Optional[str] = Field(default=None, max_length=40)

    @field_validator("label")
    @classmethod
    def clean_label(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("label must not be blank")
        return value

    @field_validator("url")
    @classmethod
    def http_url(cls, value: Optional[str]) -> Optional[str]:
        # Rendered as a link on the site: only allow http(s), never javascript: etc.
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("url must start with https:// or http://")
        return value
