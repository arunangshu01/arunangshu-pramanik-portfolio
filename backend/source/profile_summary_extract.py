import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_profile_summary import ProfileSummary
from model.base_models_errors import data_unavailable
from utility.settings import profile_summary_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class ProfileSummaryGenerator:

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
            logger.info(f"Profile Summary Data has been generated. Value: {profile_summary}")
            return profile_summary
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_profile_summary(self):
        try:
            self._profile_summary_data = get_json_data(profile_summary_file)
            profile_summary = self._format_and_validate_profile_summary_data()
            return profile_summary.model_dump()
        except Exception as error:
            logger.error(f"Profile summary data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Profile summary") from None
