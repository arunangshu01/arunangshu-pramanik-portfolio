import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_skills import Skills
from model.base_models_errors import ErrorResponseModel
from utility.settings import skills_data
from utility.logger import Logger

logger = Logger(__name__)


class SkillsGenerator:

    def __init__(self):
        self._skills_data = skills_data

    def _format_and_validate_skills_data(self):
        skills_data_df = pd.json_normalize(
            self._skills_data['skills'],
            meta=[
                'programming_languages',
                'databases',
                'data_analysis',
                'frameworks',
                'others'
            ],
            errors='ignore'
        )
        if not skills_data_df.empty:
            skills = Skills(
                programming_languages=skills_data_df['programming_languages'].iloc[0],
                databases=skills_data_df['databases'].iloc[0],
                data_analysis=skills_data_df['data_analysis'].iloc[0],
                frameworks=skills_data_df['frameworks'].iloc[0],
                others=skills_data_df['others'].iloc[0]
            )
            logger.info(f"Skills Data has been generated. Value: {skills}")
            return skills
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_skills(self):
        try:
            skills = self._format_and_validate_skills_data()
            return skills.model_dump()
        except ValidationError as vde:
            error_message = f"Error: {vde}"
            logger.error(error_message)
            error_detail = ErrorResponseModel(
                error_message=error_message,
                error_type=type(vde).__name__
            )
        except EmptyDataError as ede:
            error_message = f"Error: {ede}"
            logger.error(error_message)
            error_detail = ErrorResponseModel(
                error_message=error_message,
                error_type=type(ede).__name__
            )
        except FileNotFoundError as fnfe:
            error_message = f"Error: {fnfe}"
            logger.error(error_message)
            error_detail = ErrorResponseModel(
                error_message=error_message,
                error_type=type(fnfe).__name__
            )
        except JSONDecodeError as jde:
            error_message = f"Error: {jde}"
            logger.error(error_message)
            error_detail = ErrorResponseModel(
                error_message=error_message,
                error_type=type(jde).__name__
            )
        except Exception as e:
            error_message = f"Error: {e}"
            logger.error(error_message)
            error_detail = ErrorResponseModel(
                error_message=error_message,
                error_type=type(e).__name__
            )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error_detail.model_dump())
