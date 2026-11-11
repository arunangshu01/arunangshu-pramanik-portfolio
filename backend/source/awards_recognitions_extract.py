import pandas as pd
from pandas.errors import EmptyDataError
from model.base_models_awards_recognitions import AwardsRecognitions, AwardsRecognitionsList
from model.base_models_errors import data_unavailable
from utility.settings import awards_recognitions_file
from utility.json_cache import get_json_data
from utility.logger import Logger

logger = Logger(__name__)


class AwardsRecognitionsGenerator:

    def _format_and_validate_awards_recognitions_data(self):
        awards_recognitions_data_df = pd.json_normalize(
            self._awards_recognitions_data['awards'],
            meta=[
                'award',
                'organization',
                'timeline_period'
            ],
            errors='ignore'
        )
        if not awards_recognitions_data_df.empty:
            awards_recognitions_list = AwardsRecognitionsList(
                root=[
                    AwardsRecognitions(
                        award=row['award'],
                        organization=row['organization'],
                        timeline_period=row['timeline_period']
                    ) for _, row in awards_recognitions_data_df.iterrows()
                ]
            )
            logger.info(f"Awards & Recognitions Data has been generated. Value: {awards_recognitions_list}")
            return awards_recognitions_list
        raise EmptyDataError("No Data is present in the JSON File.")

    def display_awards_recognitions(self):
        try:
            self._awards_recognitions_data = get_json_data(awards_recognitions_file)
            awards_recognitions_list = self._format_and_validate_awards_recognitions_data()
            return awards_recognitions_list.model_dump()
        except Exception as error:
            logger.error(f"Awards data could not be loaded ({type(error).__name__}: {error})")
            raise data_unavailable("Awards") from None
