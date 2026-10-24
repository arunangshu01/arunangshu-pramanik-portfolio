from typing import Optional
from pydantic import BaseModel, Field


class AnalyticsEvent(BaseModel):
    event: str = Field(..., min_length=1, max_length=64)
    page: Optional[str] = Field(default=None, max_length=256)
    metadata: Optional[dict] = None


class AnalyticsTrackSuccess(BaseModel):
    message: str
