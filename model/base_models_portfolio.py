from pydantic import BaseModel, ValidationInfo, HttpUrl, field_validator
import re


class SocialMediaProfiles(BaseModel):
    linkedin: HttpUrl
    github: HttpUrl
    leetcode: HttpUrl


class Location(BaseModel):
    city: str
    state: str
    country: str

    @field_validator('*')
    @classmethod
    def validate_location_fields(cls, value: str, field_info: ValidationInfo):
        if not 2 < len(value) < 50:
            raise ValueError(f"{field_info.field_name} is not within proper length size.")
        return value

    def __str__(self):
        location = f"{self.city}, {self.state}, {self.country}"
        return location


class PersonalInformation(BaseModel):
    name: str
    phone: str
    location: Location
    email: str
    social_media_profiles: SocialMediaProfiles

    @field_validator('name')
    @classmethod
    def validate_name(cls, value: str) -> str:
        if ' ' not in value:
            raise ValueError("No Space Present in Name.")
        return value.title()

    @field_validator('phone')
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        phone_number_pattern = r"\+91-\d{5}-\d{5}"
        phone_number_match = re.match(phone_number_pattern, value)
        if not phone_number_match:
            raise ValueError("Invalid Phone Number.")
        return value

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        email_pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        email_match = re.match(email_pattern, value)
        if not email_match:
            raise ValueError('Invalid Email.')
        return value


class ErrorResponseModel(BaseModel):
    error_message: str
    error_type: str
