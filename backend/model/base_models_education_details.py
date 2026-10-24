from pydantic import BaseModel, ValidationInfo, field_validator
import datetime


class EducationDetails(BaseModel):
    degree: str
    institution: str
    duration: str
    dgpa: float

    @field_validator('degree','institution')
    @classmethod
    def validate_degree_institution(cls, value: str, field_info: ValidationInfo) -> str:
        if not len(value) <= 100:
            raise ValueError(f"{field_info.field_name} is of improper length.")
        return value

    @field_validator('duration')
    @classmethod
    def validate_duration(cls, value: str, field_info: ValidationInfo) -> str:
        current_year = datetime.datetime.now().year
        value_list = [int(year) for year in value.split('-')]
        for year in value_list:
            if not (isinstance(year, int) and 1 <= year <= current_year):
                raise ValueError(f"{year} in {field_info.field_name} is not a valid year.")
        return value

    @field_validator('dgpa')
    @classmethod
    def validate_dgpa(cls, value: float, field_info: ValidationInfo) -> float:
        if not isinstance(value, float):
            raise ValueError(f"{field_info.field_name} is not of float type")
        return value
