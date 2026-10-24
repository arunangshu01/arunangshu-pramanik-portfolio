from fastapi import HTTPException, status
from model.base_models_projects import ProjectList
from model.base_models_errors import ErrorResponseModel
from utility.json_cache import get_json_data
from utility.logger import Logger
from utility.settings import projects_file

logger = Logger(__name__)


class ProjectsGenerator:
    def display_projects(self):
        try:
            return ProjectList.model_validate(get_json_data(projects_file)).root
        except (OSError, ValueError):
            logger.warning('Project information could not be loaded or validated')
            detail = ErrorResponseModel(error_message='Project information is currently unavailable.',
                                        error_type='ProjectDataError')
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail=detail.model_dump())
