import time
from collections import deque
from threading import Lock


class InMemoryRateLimiter:
    """Sliding-window rate limiter keyed by client identifier (e.g. IP).

    `global_max_requests` caps all clients together, bounding abuse even when a
    caller varies its key. Idle keys are pruned so memory stays bounded.
    """

    def __init__(self, max_requests: int, window_seconds: int,
                 global_max_requests: int | None = None, max_keys: int = 10000):
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._global_max_requests = global_max_requests
        self._max_keys = max_keys
        self._hits = {}
        self._global = deque()
        self._lock = Lock()

    def _trim(self, window, now):
        while window and now - window[0] > self._window_seconds:
            window.popleft()

    def _prune(self, now):
        for key in [key for key, window in self._hits.items()
                    if not window or now - window[-1] > self._window_seconds]:
            del self._hits[key]

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            if self._global_max_requests is not None:
                self._trim(self._global, now)
                if len(self._global) >= self._global_max_requests:
                    return False
            if key not in self._hits and len(self._hits) >= self._max_keys:
                self._prune(now)
                if len(self._hits) >= self._max_keys:
                    return False
            window = self._hits.setdefault(key, deque())
            self._trim(window, now)
            if len(window) >= self._max_requests:
                return False
            window.append(now)
            if self._global_max_requests is not None:
                self._global.append(now)
            return True

    def clear(self):
        with self._lock:
            self._hits.clear()
            self._global.clear()
