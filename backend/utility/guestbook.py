"""Guestbook storage. Firestore in production, bounded memory deque locally."""
import time
from collections import deque
from datetime import datetime, timezone
from functools import cached_property
from threading import Lock

from utility.logger import Logger
from utility.settings import GUESTBOOK_BACKEND, GUESTBOOK_MAX_ENTRIES, GOOGLE_CLOUD_PROJECT

logger = Logger(__name__)
COLLECTION = "guestbook"


def _entry(name: str, message: str) -> dict:
    return {
        "name": name,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


class MemoryGuestbook:
    def __init__(self):
        self._entries = deque(maxlen=GUESTBOOK_MAX_ENTRIES)
        self._lock = Lock()

    def add(self, name: str, message: str) -> None:
        with self._lock:
            self._entries.appendleft(_entry(name, message))

    def list(self, limit: int) -> list[dict]:
        with self._lock:
            return list(self._entries)[:limit]


class FirestoreGuestbook:
    @cached_property
    def client(self):
        from google.cloud import firestore
        return firestore.Client(project=GOOGLE_CLOUD_PROJECT)

    def add(self, name: str, message: str) -> None:
        self.client.collection(COLLECTION).add(_entry(name, message))

    def list(self, limit: int) -> list[dict]:
        from google.cloud.firestore_v1.base_query import FieldFilter
        query = (self.client.collection(COLLECTION)
                 .order_by("created_at", direction="DESCENDING")
                 .limit(limit))
        return [doc.to_dict() for doc in query.stream(retry=None, timeout=5)]


guestbook_store = FirestoreGuestbook() if GUESTBOOK_BACKEND == "firestore" else MemoryGuestbook()
