import time
from collections import defaultdict, deque
from threading import Lock


class InMemoryRateLimiter:
    """Simple sliding-window rate limiter keyed by client identifier (e.g. IP)."""

    def __init__(self, max_requests: int, window_seconds: int):
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._hits = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            window = self._hits[key]
            while window and now - window[0] > self._window_seconds:
                window.popleft()
            if len(window) >= self._max_requests:
                return False
            window.append(now)
            return True
