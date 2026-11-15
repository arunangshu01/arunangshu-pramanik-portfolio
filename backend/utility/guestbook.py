"""Guestbook storage. Firestore in production, bounded memory deque locally.

Reads are served from a short in-process cache (invalidated on every write),
so page views don't each cost Firestore document reads.
"""
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from functools import cached_property
from threading import Lock

from utility.logger import Logger
from utility.settings import GOOGLE_CLOUD_PROJECT, GUESTBOOK_BACKEND, GUESTBOOK_CACHE_SECONDS, \
    GUESTBOOK_MAX_ENTRIES

logger = Logger(__name__)
COLLECTION = "guestbook"


def _new_entry(name: str, message: str) -> dict:
    return {"name": name, "message": message,
            "created_at": datetime.now(timezone.utc).isoformat()}


class _CachedList:
    def __init__(self):
        self._cache: list[dict] | None = None
        self._cached_at = 0.0
        self._lock = Lock()

    def entries(self, limit: int) -> list[dict]:
        with self._lock:
            if self._cache is None or time.monotonic() - self._cached_at >= GUESTBOOK_CACHE_SECONDS:
                self._cache = self._load(GUESTBOOK_MAX_ENTRIES)
                self._cached_at = time.monotonic()
            return self._cache[:limit]

    def invalidate(self) -> None:
        with self._lock:
            self._cache = None

    def _load(self, limit: int) -> list[dict]:
        raise NotImplementedError


class MemoryGuestbook(_CachedList):
    def __init__(self):
        super().__init__()
        self._entries = deque(maxlen=GUESTBOOK_MAX_ENTRIES)

    def add(self, name: str, message: str) -> dict:
        entry = {"id": uuid.uuid4().hex, **_new_entry(name, message)}
        self._entries.appendleft(entry)
        self.invalidate()
        return entry

    def delete(self, entry_id: str) -> bool:
        before = len(self._entries)
        self._entries = deque((e for e in self._entries if e["id"] != entry_id),
                              maxlen=GUESTBOOK_MAX_ENTRIES)
        self.invalidate()
        return len(self._entries) < before

    def reset(self) -> None:
        self._entries.clear()
        self.invalidate()

    def _load(self, limit: int) -> list[dict]:
        return list(self._entries)[:limit]


class FirestoreGuestbook(_CachedList):
    @cached_property
    def client(self):
        from google.cloud import firestore
        return firestore.Client(project=GOOGLE_CLOUD_PROJECT)

    def add(self, name: str, message: str) -> dict:
        entry = _new_entry(name, message)
        _, ref = self.client.collection(COLLECTION).add(entry)
        self.invalidate()
        return {"id": ref.id, **entry}

    def delete(self, entry_id: str) -> bool:
        ref = self.client.collection(COLLECTION).document(entry_id)
        if not ref.get(retry=None, timeout=5).exists:
            return False
        ref.delete()
        self.invalidate()
        return True

    def _load(self, limit: int) -> list[dict]:
        query = (self.client.collection(COLLECTION)
                 .order_by("created_at", direction="DESCENDING")
                 .limit(limit))
        return [{"id": doc.id, **doc.to_dict()} for doc in query.stream(retry=None, timeout=5)]


guestbook_store = FirestoreGuestbook() if GUESTBOOK_BACKEND == "firestore" else MemoryGuestbook()
