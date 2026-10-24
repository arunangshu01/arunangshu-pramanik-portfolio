from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, RootModel, field_validator


class Project(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=1000)
    technologies: list[Annotated[str, Field(min_length=1, max_length=64)]] = Field(min_length=1, max_length=24)
    live_url: HttpUrl | None = None
    github_url: HttpUrl | None = None
    highlights: list[Annotated[str, Field(min_length=1, max_length=500)]] = Field(default_factory=list, max_length=8)
    status: Literal['live', 'in_progress', 'archived'] = 'in_progress'
    featured: bool = False
    image: str | None = Field(default=None, max_length=500)
    preview_enabled: bool = False

    @field_validator('image')
    @classmethod
    def validate_image(cls, value):
        if value is not None and (not value.startswith('/') or value.startswith('//') or
                                  '\\' in value or any(char.isspace() for char in value)):
            raise ValueError('Image must be a root-relative public asset path')
        return value


class ProjectList(RootModel[list[Project]]):
    @field_validator('root')
    @classmethod
    def validate_ids(cls, projects):
        if len({project.id for project in projects}) != len(projects):
            raise ValueError('Project IDs must be unique')
        return projects
