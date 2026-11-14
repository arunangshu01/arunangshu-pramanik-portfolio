from pydantic import BaseModel, ConfigDict, Field


class AskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=3, max_length=500)


class AskResponse(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)
