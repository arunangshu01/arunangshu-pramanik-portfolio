from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

StatusKind = Literal["building", "reading", "learning", "exploring", "listening"]


class NowStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: StatusKind
    label: str = Field(min_length=1, max_length=120)
    url: Optional[str] = Field(default=None, max_length=256)
    updated_at: Optional[str] = Field(default=None, max_length=40)
