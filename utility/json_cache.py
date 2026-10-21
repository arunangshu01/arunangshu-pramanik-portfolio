import os
from threading import Lock
from typing import Any
from utility.extract_json_data import extract_data_from_json_file

_cache = {}
_lock = Lock()


def get_json_data(json_file_path: str) -> Any:
    """Return parsed JSON, cached in memory and re-read only when the file changes."""
    mtime = os.path.getmtime(json_file_path)
    with _lock:
        entry = _cache.get(json_file_path)
        if entry is None or entry[0] != mtime:
            entry = (mtime, extract_data_from_json_file(json_file_path))
            _cache[json_file_path] = entry
        return entry[1]


def clear_cache() -> None:
    with _lock:
        _cache.clear()
