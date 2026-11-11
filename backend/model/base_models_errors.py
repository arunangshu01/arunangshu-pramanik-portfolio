from fastapi import HTTPException, status
from pydantic import BaseModel


class ErrorResponseModel(BaseModel):
    error_message: str
    error_type: str


def data_unavailable(label: str) -> HTTPException:
    """Generic client-facing error for portfolio data that failed to load or validate.

    Exception details (file paths, validation internals) belong in server logs only.
    """
    detail = ErrorResponseModel(error_message=f"{label} information is currently unavailable.",
                                error_type="DataUnavailable")
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=detail.model_dump())
