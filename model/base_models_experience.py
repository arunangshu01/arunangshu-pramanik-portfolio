from pydantic import BaseModel, RootModel, ValidationInfo, field_validator
from typing import List


class Experience(BaseModel):
    role: str
    company: str
    location: str
    duration: str
    client: str
    responsibilities: List[str]

    @field_validator('role', 'company', 'location', 'duration', 'client')
    @classmethod
    def validate_role_company_location_duration_client(cls, value: str, field_info: ValidationInfo) -> str:
        if not len(value) <= 100:
            raise ValueError(f"Value in {field_info.field_name} is of improper size.")
        return value

    @field_validator('responsibilities')
    @classmethod
    def validate_responsibilities(cls, values: List[str], field_info: ValidationInfo) -> List[str]:
        for value in values:
            if not len(value) <= 500:
                raise ValueError(f"Value in {field_info.field_name} is of improper size.")
        if not len(values) <= 10:
            raise ValueError(f"{field_info.field_name} is of improper length.")
        return values


class ExperienceList(RootModel):
    root: List[Experience]
