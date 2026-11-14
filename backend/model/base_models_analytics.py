import re
from typing import Literal, Optional, get_args
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Events the frontend sends. Anything else is rejected so arbitrary names can't
# reach the public dashboard counters.
ClientEvent = Literal[
    "page_view", "section_view", "cta_click", "social_click", "theme_toggle",
    "palette_open", "palette_command", "music_play",
    "project_click", "project_preview", "project_case_study",
    "github_click", "linkedin_click", "leetcode_click", "email_click",
    "share_click", "ask_open",
]
CLIENT_EVENTS = frozenset(get_args(ClientEvent))
# Recorded by the API itself (never accepted from /analytics/track).
SERVER_EVENTS = frozenset({"resume_view", "resume_download", "resume_print",
                           "contact_submit", "ask_question"})
PUBLIC_EVENTS = CLIENT_EVENTS | SERVER_EVENTS
METADATA_KEY_PATTERN = re.compile(r"[a-z_]{1,32}")
METADATA_MAX_KEYS = 8
METADATA_MAX_VALUE_LENGTH = 256


class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event: ClientEvent
    page: Optional[str] = Field(default=None, max_length=256)
    metadata: Optional[dict[str, str | int | float | bool | None]] = None

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, value):
        if value is None:
            return value
        if len(value) > METADATA_MAX_KEYS:
            raise ValueError(f"metadata may contain at most {METADATA_MAX_KEYS} keys")
        for key, item in value.items():
            if not METADATA_KEY_PATTERN.fullmatch(key):
                raise ValueError("metadata keys must be lowercase letters and underscores")
            if isinstance(item, str) and len(item) > METADATA_MAX_VALUE_LENGTH:
                raise ValueError(f"metadata values must be at most {METADATA_MAX_VALUE_LENGTH} characters")
        return value


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
