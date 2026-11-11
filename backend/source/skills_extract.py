import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_skills import Skills
from model.base_models_errors import data_unavailable
from utility.settings import skills_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class SkillsGenerator:

    def _format_and_validate_skills_data(self):
        if self._skills_data and 'skills' in self._skills_data:
            skills = Skills(**self._skills_data['skills'])
            logger.info(f"Skills Data has been generated. Value: {skills}")
            return skills
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_skills(self):
        try:
            self._skills_data = get_json_data(skills_file)
            skills = self._format_and_validate_skills_data()
            return skills.model_dump()
        except Exception as error:
            logger.error(f"Skills data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Skills") from None
