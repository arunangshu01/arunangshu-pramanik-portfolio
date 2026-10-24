import time
from datetime import datetime, timedelta, timezone
from functools import cached_property
from threading import Lock
from utility.settings import VIEW_COUNTER_BACKEND, GOOGLE_CLOUD_PROJECT

ACTIVE_SECONDS = 90
RETENTION_SECONDS = 86400


class MemoryViewCounter:
    def __init__(self):
        self._total = 0
        self._views = {}
        self._sessions = {}
        self._lock = Lock()

    def _stats(self, now):
        self._sessions = {key: seen for key, seen in self._sessions.items() if seen > now - ACTIVE_SECONDS}
        return {"total_views": self._total, "viewing_now": len(self._sessions)}

    def heartbeat(self, view_id, session_id, now=None):
        now = time.time() if now is None else now
        with self._lock:
            self._views = {key: seen for key, seen in self._views.items() if seen > now - RETENTION_SECONDS}
            if view_id not in self._views:
                if len(self._views) >= 10000:
                    raise RuntimeError("Local view storage is full")
                self._total += 1
            self._views[view_id] = now
            self._sessions[session_id] = now
            return self._stats(now)

    def stats(self, now=None):
        with self._lock:
            return self._stats(time.time() if now is None else now)


class FirestoreViewCounter:
    def __init__(self):
        self._snapshot = None
        self._snapshot_until = 0
        self._lock = Lock()

    @cached_property
    def client(self):
        from google.cloud import firestore
        return firestore.Client(project=GOOGLE_CLOUD_PROJECT)

    def heartbeat(self, view_id, session_id):
        from google.cloud import firestore
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=RETENTION_SECONDS)
        view = self.client.collection("portfolio_views").document(view_id)
        session = self.client.collection("portfolio_sessions").document(session_id)
        total = self.client.collection("portfolio_stats").document("views")

        @firestore.transactional
        def record(transaction):
            existing = view.get(transaction=transaction, retry=None, timeout=5)
            if not existing.exists:
                transaction.set(total, {"total_views": firestore.Increment(1)}, merge=True)
            transaction.set(view, {"expires_at": expires_at})
            transaction.set(session, {"last_seen": now, "expires_at": expires_at})

        record(self.client.transaction(max_attempts=3))
        return self.stats()

    def stats(self):
        from google.cloud.firestore_v1.base_query import FieldFilter
        with self._lock:
            if self._snapshot is not None and time.monotonic() < self._snapshot_until:
                return dict(self._snapshot)
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=ACTIVE_SECONDS)
            total = self.client.collection("portfolio_stats").document("views").get(retry=None, timeout=5)
            active = self.client.collection("portfolio_sessions").where(filter=FieldFilter("last_seen", ">", cutoff))
            count = active.count().get(retry=None, timeout=5)[0][0].value
            self._snapshot = {"total_views": (total.to_dict() or {}).get("total_views", 0), "viewing_now": count}
            self._snapshot_until = time.monotonic() + 10
            return dict(self._snapshot)


view_counter = FirestoreViewCounter() if VIEW_COUNTER_BACKEND == "firestore" else MemoryViewCounter()
