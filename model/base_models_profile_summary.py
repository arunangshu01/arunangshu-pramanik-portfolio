from pydantic import BaseModel, field_validator


class ProfileSummary(BaseModel):
    summary: str

    @field_validator('summary')
    @classmethod
    def validate_summary(cls, value: str) -> str:
        if not len(value) <= 500:
            raise ValueError("Profile Summary should be within 500 characters.")
        return value
