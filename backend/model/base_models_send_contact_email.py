from pydantic import BaseModel, EmailStr, Field, ValidationError, field_validator
from fastapi import Form
from fastapi.exceptions import RequestValidationError

NAME_MAX_LENGTH = 100
MESSAGE_MAX_LENGTH = 5000


class ContactForm(BaseModel):
    name: str = Field(min_length=1, max_length=NAME_MAX_LENGTH)
    email: EmailStr = Field(max_length=254)
    message: str = Field(min_length=1, max_length=MESSAGE_MAX_LENGTH)

    @field_validator("name", "message", mode="before")
    @classmethod
    def strip_whitespace(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("name")
    @classmethod
    def single_line_name(cls, value):
        # The name is used in the email subject and sender display name.
        if any(char in value for char in "\r\n\t") or not value.isprintable():
            raise ValueError("Name must be a single line of printable text")
        return value

    @classmethod
    def as_form(cls,
                name: str = Form(..., max_length=NAME_MAX_LENGTH * 2),
                email: str = Form(..., max_length=254),
                message: str = Form(..., max_length=MESSAGE_MAX_LENGTH * 2)):
        try:
            return cls(name=name, email=email, message=message)
        except ValidationError as error:
            raise RequestValidationError(error.errors(include_url=False, include_context=False)) from None


class SendMessageSuccess(BaseModel):
    message: str
