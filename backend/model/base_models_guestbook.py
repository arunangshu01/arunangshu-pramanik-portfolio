from pydantic import BaseModel, ConfigDict, Field, field_validator


class GuestbookEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=60)
    message: str = Field(min_length=1, max_length=280)

    @field_validator("name", "message")
    @classmethod
    def single_clean_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("field must not be blank")
        return value


class GuestbookPostSuccess(BaseModel):
    message: str


class GuestbookPublicEntry(BaseModel):
    name: str
    message: str
    created_at: str


class GuestbookList(BaseModel):
    entries: list[GuestbookPublicEntry]
