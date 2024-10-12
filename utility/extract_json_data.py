import json
from json import JSONDecodeError
from typing import Any
from utility.logger import Logger

logger = Logger(__name__)


def extract_data_from_json_file(json_file_path: str) -> Any:
    try:
        with open(json_file_path, 'r') as json_data_file:
            json_data = json.load(json_data_file)
        logger.info(f"JSON Data from File - {json_data_file.name}: {json_data}")
        return json_data
    except FileNotFoundError as fnfe:
        error_message = f"File: {json_file_path} is not found. Extras: {fnfe}"
        raise FileNotFoundError(error_message)
    except JSONDecodeError as jde:
        error_message = f"Error decoding JSON from the File: {json_file_path}. Extras: {jde}"
        raise JSONDecodeError(error_message)
    except Exception as e:
        error_message = f"An Error Occurred: {e}."
        raise Exception(error_message)
