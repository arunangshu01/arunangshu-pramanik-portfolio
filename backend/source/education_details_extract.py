import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_education_details import EducationDetails
from model.base_models_errors import data_unavailable
from utility.settings import education_details_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class EducationDetailsGenerator:

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
            self._education_details_data = get_json_data(education_details_file)
            education_details = self._format_and_validate_education_details_data()
            return education_details.model_dump()
        except Exception as error:
            logger.error(f"Education data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Education") from None
