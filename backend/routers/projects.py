from fastapi import APIRouter
from model.base_models_projects import Project
from source.projects_extract import ProjectsGenerator

router = APIRouter(tags=['Projects'])


@router.get('/projects', response_model=list[Project])
def fetch_projects():
    return ProjectsGenerator().display_projects()
