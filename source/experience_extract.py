import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_experience import Experience, ExperienceList
from model.base_models_errors import ErrorResponseModel
from utility.settings import experience_data
from utility.logger import Logger

logger = Logger(__name__)


class ExperienceGenerator:

    def __init__(self):
        self._experience_data = experience_data

    def _format_and_validate_experience_data(self):
        experience_data_df = pd.json_normalize(
            self._experience_data['experience'],
            meta=[
                'role',
                'company',
                'location',
                'duration',
                'clients_or_customers',
                'responsibilities'
            ],
            errors='ignore'
        )
        if not experience_data_df.empty:
            experience_list = ExperienceList(
                root=[
                    Experience(
                        role=row['role'],
                        company=row['company'],
                        location=row['location'],
                        duration=row['duration'],
                        clients_or_customers=row['clients_or_customers'],
                        responsibilities=row['responsibilities']
                    ) for _, row in experience_data_df.iterrows()
                ]
            )
            logger.info(f"Experience Data has been generated. Value: {experience_list}")
            return experience_list
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_experience(self):
        try:
            experience_list = self._format_and_validate_experience_data()
            return experience_list.model_dump()
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
