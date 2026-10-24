import time
from collections import Counter, deque
from threading import Lock
from typing import Optional

MAX_RECENT_EVENTS = 500


class AnalyticsTracker:
    """In-memory event counter with a bounded recent-events log."""

    def __init__(self):
        self._started_at = time.time()
        self._counts = Counter()
        self._events = deque(maxlen=MAX_RECENT_EVENTS)
        self._lock = Lock()

    def track(self, event: str, page: Optional[str] = None, client: Optional[str] = None,
              metadata: Optional[dict] = None):
        record = {
            "event": event,
            "page": page,
            "client": client,
            "metadata": metadata or {},
            "timestamp": time.time()
        }
        with self._lock:
            self._counts[event] += 1
            self._events.append(record)

    def summary(self, recent: int = 20) -> dict:
        with self._lock:
            return {
                "since": self._started_at,
                "total_events": sum(self._counts.values()),
                "counts": dict(self._counts.most_common()),
                "recent_events": list(self._events)[-recent:][::-1]
            }

    def reset(self):
        with self._lock:
            self._counts.clear()
            self._events.clear()


tracker = AnalyticsTracker()
