import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_personal_info import PersonalInformation, Location, SocialMediaProfiles
from model.base_models_errors import data_unavailable
from utility.settings import personal_info_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class PersonalInformationGenerator:

    def _format_and_validate_personal_info_data(self):
        personal_info_data_df = pd.json_normalize(
            self._personal_info_data,
            meta=[
                'name',
                'phone',
                ['location', 'city'],
                ['location', 'state'],
                ['location', 'country'],
                'email',
                ['social_media_profiles', 'linkedin'],
                ['social_media_profiles', 'github'],
                ['social_media_profiles', 'leetcode']
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
            self._personal_info_data = get_json_data(personal_info_file)
            personal_info = self._format_and_validate_personal_info_data()
            return personal_info.model_dump()
        except Exception as error:
            logger.error(f"Personal data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Personal") from None
