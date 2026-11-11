import re
import time
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from functools import cached_property
from threading import Lock
from model.base_models_analytics import PUBLIC_EVENTS
from utility.logger import Logger
from utility.settings import VIEW_COUNTER_BACKEND, GOOGLE_CLOUD_PROJECT

logger = Logger(__name__)

ACTIVE_SECONDS = 90
RETENTION_SECONDS = 86400
DAILY_RETENTION_DAYS = 90
DASHBOARD_DAYS = 14
DASHBOARD_CACHE_SECONDS = 30
PROJECT_KEY_PATTERN = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
PROJECT_EVENT_FIELDS = {
    "project_click": "clicks",
    "project_preview": "previews",
    "project_case_study": "case_studies",
}


def _daily_entries(daily_counts, days=DASHBOARD_DAYS, now=None):
    today = (now or datetime.now(timezone.utc)).date()
    return [{"date": (today - timedelta(days=offset)).isoformat(),
             "views": daily_counts.get((today - timedelta(days=offset)).isoformat(), 0)}
            for offset in range(days - 1, -1, -1)]


class MemoryViewCounter:
    def __init__(self):
        self._total = 0
        self._views = {}
        self._sessions = {}
        self._daily = Counter()
        self._events = Counter()
        self._projects = defaultdict(Counter)
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
                self._daily[datetime.fromtimestamp(now, timezone.utc).date().isoformat()] += 1
            self._views[view_id] = now
            self._sessions[session_id] = now
            return self._stats(now)

    def stats(self, now=None):
        with self._lock:
            return self._stats(time.time() if now is None else now)

    def record_event(self, event, project=None):
        if event not in PUBLIC_EVENTS:
            return
        with self._lock:
            self._events[event] += 1
            field = PROJECT_EVENT_FIELDS.get(event)
            if field and project and len(project) <= 80 and PROJECT_KEY_PATTERN.fullmatch(project):
                self._projects[project][field] += 1

    def dashboard(self):
        with self._lock:
            return {**self._stats(time.time()),
                    "daily_views": _daily_entries(self._daily),
                    "events": dict(self._events.most_common()),
                    "projects": {key: dict(counts) for key, counts in self._projects.items()}}


class FirestoreViewCounter:
    def __init__(self):
        self._snapshot = None
        self._snapshot_until = 0
        self._lock = Lock()
        self._dashboard = None
        self._dashboard_until = 0
        self._dashboard_lock = Lock()

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
        daily = self.client.collection("portfolio_daily").document(now.date().isoformat())

        @firestore.transactional
        def record(transaction):
            existing = view.get(transaction=transaction, retry=None, timeout=5)
            if not existing.exists:
                transaction.set(total, {"total_views": firestore.Increment(1)}, merge=True)
                transaction.set(daily, {"views": firestore.Increment(1),
                                        "expires_at": now + timedelta(days=DAILY_RETENTION_DAYS)},
                                merge=True)
            transaction.set(view, {"expires_at": expires_at})
            transaction.set(session, {"last_seen": now, "expires_at": expires_at})

        record(self.client.transaction(max_attempts=3))
        return self.stats()

    def record_event(self, event, project=None):
        from google.cloud import firestore
        if event not in PUBLIC_EVENTS:
            return
        fields = {"events": {event: firestore.Increment(1)}}
        field = PROJECT_EVENT_FIELDS.get(event)
        if field and project and len(project) <= 80 and PROJECT_KEY_PATTERN.fullmatch(project):
            fields["projects"] = {project: {field: firestore.Increment(1)}}
        self.client.collection("portfolio_stats").document("public").set(fields, merge=True)

    def dashboard(self):
        # Public and polled by every visitor: serve a short-lived snapshot so reads
        # stay bounded no matter how often the endpoint is hit.
        with self._dashboard_lock:
            if self._dashboard is not None and time.monotonic() < self._dashboard_until:
                return deepcopy(self._dashboard)
            result = self.stats()
            public = self.client.collection("portfolio_stats").document("public").get(retry=None, timeout=5)
            public_data = public.to_dict() or {}
            today = datetime.now(timezone.utc).date()
            collection = self.client.collection("portfolio_daily")
            refs = [collection.document((today - timedelta(days=offset)).isoformat())
                    for offset in range(DASHBOARD_DAYS)]
            daily_counts = {doc.id: (doc.to_dict() or {}).get("views", 0)
                            for doc in self.client.get_all(refs, retry=None, timeout=5) if doc.exists}
            self._dashboard = {**result,
                               "daily_views": _daily_entries(daily_counts),
                               "events": dict(sorted((public_data.get("events") or {}).items(),
                                                     key=lambda item: item[1], reverse=True)),
                               "projects": public_data.get("projects") or {}}
            self._dashboard_until = time.monotonic() + DASHBOARD_CACHE_SECONDS
            return deepcopy(self._dashboard)

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


def record_public_event(event, project=None):
    """Best-effort public counter update; analytics must never break the request."""
    try:
        view_counter.record_event(event, project)
    except Exception:
        logger.warning(f"Failed to persist public event counter for {event}")
