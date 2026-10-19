from pydantic import BaseModel, RootModel, ValidationInfo, field_validator
from typing import List, Union


class AwardsRecognitions(BaseModel):
    award: str
    organization: str
    timeline_period: Union[str, List[str]]

    @field_validator('award', 'organization')
    @classmethod
    def validate_award_organization(cls, value: str, field_info: ValidationInfo) -> str:
        if not len(value) <= 100:
            raise ValueError(f"Value in {field_info.field_name} is of improper size.")
        return value

    @field_validator('timeline_period')
    @classmethod
    def validate_timeline_period(cls, value: Union[str, List[str]], field_info: ValidationInfo) -> Union[str, List[str]]:
        if not (isinstance(value, str) or isinstance(value, list)):
            raise ValueError(f'Invalid format in for {field_info.field_name}')
        return value


class AwardsRecognitionsList(RootModel):
    root: List[AwardsRecognitions]
