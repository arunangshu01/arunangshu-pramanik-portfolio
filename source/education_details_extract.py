import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_education_details import EducationDetails
from model.base_models_errors import ErrorResponseModel
from utility.settings import education_details_data
from utility.logger import Logger

logger = Logger(__name__)


class EducationDetailsGenerator:

    def __init__(self):
        self._education_details_data = education_details_data

    def _format_and_validate_education_details_data(self):
        education_details_data_df = pd.json_normalize(
            self._education_details_data['education'],
            meta=[
                'degree',
                'institution',
                'duration',
                'dgpa'
            ],
            errors='ignore'
        )
        if not education_details_data_df.empty:
            education_details = EducationDetails(
                degree=education_details_data_df['degree'].iloc[0],
                institution=education_details_data_df['institution'].iloc[0],
                duration=education_details_data_df['duration'].iloc[0],
                dgpa=education_details_data_df['dgpa'].iloc[0]
            )
            logger.info(f"Education Details Data has been generated. Value: {education_details}")
            return education_details
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_education_details(self):
        try:
            education_details = self._format_and_validate_education_details_data()
            return education_details.model_dump()
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
