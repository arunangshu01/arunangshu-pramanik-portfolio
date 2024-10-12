from pydantic import BaseModel, ValidationInfo, field_validator
from typing import List


class Skills(BaseModel):
    programming_languages: List[str]
    databases: List[str]
    data_analysis: List[str]
    frameworks: List[str]
    others: List[str]

    @field_validator('*')
    @classmethod
    def validate_skill_fields(cls, values: List[str], field_info: ValidationInfo) -> List[str]:
        for value in values:
            if not len(value) <= 50:
                raise ValueError(f"Value in {field_info.field_name} is of improper size.")
        if not len(values) <= 100:
            raise ValueError(f"{field_info.field_name} is of improper length.")
        return values
