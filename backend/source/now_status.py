import json
from datetime import datetime, timezone

from model.base_models_errors import data_unavailable
from model.base_models_now_status import NowStatus
from utility.json_cache import get_json_data, clear_cache
from utility.logger import Logger
from utility.settings import now_status_file

logger = Logger(__name__)


def get_now_status() -> dict:
    try:
        return NowStatus(**get_json_data(now_status_file)).model_dump()
    except Exception as error:
        logger.error(f"Now-status data could not be loaded ({type(error).__name__}: {error})")
        raise data_unavailable("Now status") from None


def update_now_status(update: NowStatus) -> dict:
    record = update.model_dump(exclude_none=True)
    record["updated_at"] = datetime.now(timezone.utc).date().isoformat()
    with open(now_status_file, "w", encoding="utf-8") as handle:
        json.dump(record, handle, indent=2)
        handle.write("\n")
    clear_cache()
    return record
