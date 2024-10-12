import pandas as pd
from pandas.errors import EmptyDataError
from json import JSONDecodeError
from starlette import status
from pydantic import ValidationError
from fastapi import HTTPException
from model.base_models_personal_info import PersonalInformation, Location, SocialMediaProfiles
from model.base_models_errors import ErrorResponseModel
from utility.settings import personal_info_data
from utility.logger import Logger

logger = Logger(__name__)


class PersonalInformationGenerator:

    def __init__(self):
        self._personal_info_data = personal_info_data

    def _format_and_validate_personal_info_data(self):
        personal_info_data_df = pd.json_normalize(
            self._personal_info_data,
            meta=[
                'name', "phone",
                ["location", "city"], ["location", "state"], ["location", "country"],
                "email", ["social_media_profiles", "linkedin"], ["social_media_profiles", "github"],
                ["social_media_profiles", "leetcode"]
            ],
            errors='ignore'
        )
        if not personal_info_data_df.empty:
            location = Location(
                city=personal_info_data_df['location.city'].iloc[0],
                state=personal_info_data_df['location.state'].iloc[0],
                country=personal_info_data_df['location.country'].iloc[0]
            )
            social_media_profiles = SocialMediaProfiles(
                linkedin=personal_info_data_df['social_media_profiles.linkedin'].iloc[0],
                github=personal_info_data_df['social_media_profiles.github'].iloc[0],
                leetcode=personal_info_data_df['social_media_profiles.leetcode'].iloc[0],
            )
            personal_info = PersonalInformation(
                name=personal_info_data_df['name'].iloc[0],
                phone=personal_info_data_df['phone'].iloc[0],
                location=location,
                email=personal_info_data_df['email'].iloc[0],
                social_media_profiles=social_media_profiles
            )
            logger.info(f"Personal Information Data has been generated. Value: {personal_info}")
            return personal_info
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_personal_info(self):
        try:
            personal_info = self._format_and_validate_personal_info_data()
            return personal_info.model_dump()
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
