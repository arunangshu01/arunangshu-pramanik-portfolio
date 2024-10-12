from pydantic import BaseModel


class ErrorResponseModel(BaseModel):
    error_message: str
    error_type: str
