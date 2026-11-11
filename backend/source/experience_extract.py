import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_experience import Experience, ExperienceList
from model.base_models_errors import data_unavailable
from utility.settings import experience_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class ExperienceGenerator:

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
            self._experience_data = get_json_data(experience_file)
            experience_list = self._format_and_validate_experience_data()
            return experience_list.model_dump()
        except Exception as error:
            logger.error(f"Experience data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Experience") from None
