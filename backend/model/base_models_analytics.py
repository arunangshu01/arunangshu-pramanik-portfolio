from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AnalyticsEvent(BaseModel):
    event: str = Field(..., min_length=1, max_length=64)
    page: Optional[str] = Field(default=None, max_length=256)
    metadata: Optional[dict] = None


class AnalyticsTrackSuccess(BaseModel):
    message: str


class ViewPresence(BaseModel):
    model_config = ConfigDict(extra="forbid")
    view_id: UUID
    session_id: UUID


class PublicViewStats(BaseModel):
    total_views: int = Field(ge=0)
    viewing_now: int = Field(ge=0)


class DailyViews(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    views: int = Field(ge=0)


class ProjectEngagement(BaseModel):
    clicks: int = Field(default=0, ge=0)
    previews: int = Field(default=0, ge=0)
    case_studies: int = Field(default=0, ge=0)


class PublicDashboard(BaseModel):
    total_views: int = Field(ge=0)
    viewing_now: int = Field(ge=0)
    daily_views: list[DailyViews]
    events: dict[str, int]
    projects: dict[str, ProjectEngagement]
