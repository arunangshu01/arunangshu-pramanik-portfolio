import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_awards_recognitions import AwardsRecognitions, AwardsRecognitionsList
from model.base_models_errors import ErrorResponseModel
from utility.settings import awards_recognitions_data
from utility.logger import Logger

logger = Logger(__name__)


class AwardsRecognitionsGenerator:

    def __init__(self):
        self._awards_recognitions_data = awards_recognitions_data

    def _format_and_validate_awards_recognitions_data(self):
        awards_recognitions_data_df = pd.json_normalize(
            self._awards_recognitions_data['awards'],
            meta=[
                'award',
                'organization',
                'dates'
            ],
            errors='ignore'
        )
        if not awards_recognitions_data_df.empty:
            awards_recognitions_list = AwardsRecognitionsList(
                root=[
                    AwardsRecognitions(
                        award=row['award'],
                        organization=row['organization'],
                        dates=row['dates']
                    ) for _, row in awards_recognitions_data_df.iterrows()
                ]
            )
            logger.info(f"Awards & Recognitions Data has been generated. Value: {awards_recognitions_list}")
            return awards_recognitions_list
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_awards_recognitions(self):
        try:
            awards_recognitions_list = self._format_and_validate_awards_recognitions_data()
            return awards_recognitions_list.model_dump()
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
