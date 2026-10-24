from pydantic import BaseModel, ValidationInfo, field_validator


class ProfileSummary(BaseModel):
    summary: str

    @field_validator('summary')
    @classmethod
    def validate_summary(cls, value: str, field_info: ValidationInfo) -> str:
        if not len(value) <= 500:
            raise ValueError(f"{field_info.field_name} should be within 500 characters.")
        return value
