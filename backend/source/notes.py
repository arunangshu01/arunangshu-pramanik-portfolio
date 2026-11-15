"""Notes section: markdown files in information/notes/, named YYYY-MM-DD-slug.md.

The first `# ` heading is the title; the first non-heading paragraph is the
excerpt. Files are read fresh each request and served through a short cache.
"""
import re
import time
from pathlib import Path

from model.base_models_errors import data_unavailable
from utility.logger import Logger
from utility.settings import notes_dir

logger = Logger(__name__)

_SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,80}$")
_CACHE_SECONDS = 60
_cache: dict[str, tuple[float, object]] = {}


def _cached(key: str, loader):
    entry = _cache.get(key)
    if entry and time.monotonic() - entry[0] < _CACHE_SECONDS:
        return entry[1]
    value = loader()
    _cache[key] = (time.monotonic(), value)
    return value


def _parse(path: Path) -> dict | None:
    match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md", path.name)
    if not match:
        return None
    date, slug = match.groups()
    text = path.read_text(encoding="utf-8")
    title = slug.replace("-", " ").title()
    excerpt = ""
    body_lines = []
    title_found = False
    for line in text.splitlines():
        if line.startswith("# ") and not title_found:
            title = line[2:].strip()
            title_found = True
            continue
        if not excerpt and line.strip() and not line.startswith("#"):
            excerpt = line.strip()[:160]
        body_lines.append(line)
    return {
        "id": slug,
        "title": title,
        "date": date,
        "excerpt": excerpt,
        "markdown": "\n".join(body_lines).strip(),
    }


def list_notes() -> list[dict]:
    def load():
        directory = Path(notes_dir)
        if not directory.is_dir():
            return []
        notes = [n for p in sorted(directory.glob("*.md"), reverse=True)
                 if (n := _parse(p))]
        return [{k: v for k, v in n.items() if k != "markdown"} for n in notes]
    try:
        return _cached("list", load)
    except Exception as error:
        logger.error(f"Notes could not be listed ({type(error).__name__}: {error})")
        raise data_unavailable("Notes") from None


def get_note(note_id: str) -> dict | None:
    if not _SLUG.fullmatch(note_id):
        return None

    def load():
        directory = Path(notes_dir)
        if not directory.is_dir():
            return []
        return [_parse(p) for p in directory.glob(f"*-{note_id}.md") if _parse(p)]
    try:
        matches = _cached(f"note:{note_id}", load)
    except Exception as error:
        logger.error(f"Note {note_id} could not be loaded ({type(error).__name__}: {error})")
        raise data_unavailable("Notes") from None
    return matches[0] if matches else None
