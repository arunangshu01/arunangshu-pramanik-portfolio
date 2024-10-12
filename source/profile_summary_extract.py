import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_profile_summary import ProfileSummary
from model.base_models_errors import ErrorResponseModel
from utility.settings import profile_summary_data
from utility.logger import Logger

logger = Logger(__name__)


class ProfileSummaryGenerator:

    def __init__(self):
        self._profile_summary_data = profile_summary_data

    def _format_and_validate_profile_summary_data(self):
        profile_summary_data_df = pd.json_normalize(
            self._profile_summary_data,
            meta=[
                'summary'
            ],
            errors='ignore'
        )
        if not profile_summary_data_df.empty:
            profile_summary = ProfileSummary(
                summary=profile_summary_data_df['summary'].iloc[0]
            )
            logger.info(f"Profile Summary has been generated. Value: {profile_summary}")
            return profile_summary
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_profile_summary(self):
        try:
            profile_summary = self._format_and_validate_profile_summary_data()
            return profile_summary.model_dump()
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
