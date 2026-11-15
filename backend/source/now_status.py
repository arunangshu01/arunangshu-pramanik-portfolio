"""Now-status badge.

`now_status.json` is the committed default. `PUT /status` stores an override:
in Firestore when NOW_STATUS_BACKEND=firestore (survives Cloud Run restarts and
scale-to-zero), otherwise in process memory for local development. The
override wins until `DELETE /status` clears it.
"""
import time
from datetime import datetime, timezone
from functools import cached_property
from threading import Lock

from model.base_models_errors import data_unavailable
from model.base_models_now_status import NowStatus
from utility.json_cache import get_json_data
from utility.logger import Logger
from utility.settings import GOOGLE_CLOUD_PROJECT, NOW_STATUS_BACKEND, now_status_file

logger = Logger(__name__)

READ_CACHE_SECONDS = 30
_MISSING = object()


class MemoryOverride:
    def __init__(self):
        self._value = None

    def get(self):
        return self._value

    def set(self, value: dict):
        self._value = value

    def clear(self):
        self._value = None


class FirestoreOverride:
    """Single document; reads are cached briefly so page views don't each cost a read."""

    def __init__(self):
        self._cached = _MISSING
        self._cached_at = 0.0
        self._lock = Lock()

    @cached_property
    def doc(self):
        from google.cloud import firestore
        return firestore.Client(project=GOOGLE_CLOUD_PROJECT) \
            .collection("portfolio_config").document("now_status")

    def get(self):
        with self._lock:
            if self._cached is not _MISSING and time.monotonic() - self._cached_at < READ_CACHE_SECONDS:
                return self._cached
            snapshot = self.doc.get(retry=None, timeout=5)
            self._cached = snapshot.to_dict() if snapshot.exists else None
            self._cached_at = time.monotonic()
            return self._cached

    def set(self, value: dict):
        self.doc.set(value)
        with self._lock:
            self._cached, self._cached_at = value, time.monotonic()

    def clear(self):
        self.doc.delete()
        with self._lock:
            self._cached, self._cached_at = None, time.monotonic()


override_store = FirestoreOverride() if NOW_STATUS_BACKEND == "firestore" else MemoryOverride()


def _default() -> dict:
    return NowStatus(**get_json_data(now_status_file)).model_dump()


def get_now_status() -> dict:
    try:
        override = override_store.get()
        if override:
            return NowStatus(**override).model_dump()
    except Exception as error:
        logger.warning(f"Now-status override unavailable, using default ({type(error).__name__})")
    try:
        return _default()
    except Exception as error:
        logger.error(f"Now-status data could not be loaded ({type(error).__name__}: {error})")
        raise data_unavailable("Now status") from None


def update_now_status(update: NowStatus) -> dict:
    record = update.model_dump(exclude_none=True)
    record["updated_at"] = datetime.now(timezone.utc).date().isoformat()
    override_store.set(record)
    return NowStatus(**record).model_dump()


def reset_now_status() -> dict:
    override_store.clear()
    return get_now_status()
