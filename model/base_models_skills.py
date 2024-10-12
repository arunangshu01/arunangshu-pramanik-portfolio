from pydantic import BaseModel, ValidationInfo, field_validator
from typing import Dict


class Skills(BaseModel):
    programming_languages: Dict[str]
    databases: Dict[str]
    data_analysis: Dict[str]
    frameworks: Dict[str]
    others: Dict[str]

    @field_validator('*')
    @classmethod
    def validate_skill_fields(cls, values: Dict[str], field_info: ValidationInfo) -> Dict[str]:
        for value in values:
            if not len(value) <= 50:
                raise ValueError(f"Value in {field_info.field_name} is of improper size.")
        if len(values) <= 100:
            raise ValueError(f"{field_info.field_name} is of improper length.")
        return values
