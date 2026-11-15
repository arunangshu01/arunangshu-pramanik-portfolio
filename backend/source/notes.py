"""Notes section: markdown files in information/notes/, named YYYY-MM-DD-slug.md.

The first `# ` heading is the title; the first non-heading paragraph is the
excerpt. All notes are parsed into one index, rebuilt when the directory's
contents change, so lookups are exact and memory stays bounded.
"""
import re
from pathlib import Path
from threading import Lock

from model.base_models_errors import data_unavailable
from utility.logger import Logger
from utility.settings import notes_dir

logger = Logger(__name__)

FILENAME = re.compile(r"(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md")
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
MAX_NOTE_BYTES = 200_000

_index: tuple[tuple, list[dict]] | None = None
_lock = Lock()


def _parse(path: Path) -> dict | None:
    match = FILENAME.fullmatch(path.name)
    if not match or path.stat().st_size > MAX_NOTE_BYTES:
        return None
    date, slug = match.groups()
    title, excerpt, body = slug.replace("-", " ").title(), "", []
    title_found = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# ") and not title_found:
            title, title_found = line[2:].strip(), True
            continue
        if not excerpt and line.strip() and not line.lstrip().startswith(("#", "```", "-", "*")):
            excerpt = line.strip()[:160]
        body.append(line)
    return {"id": slug, "title": title, "date": date, "excerpt": excerpt,
            "markdown": "\n".join(body).strip()}


def _notes() -> list[dict]:
    global _index
    directory = Path(notes_dir)
    files = sorted(directory.glob("*.md")) if directory.is_dir() else []
    signature = tuple((p.name, p.stat().st_mtime_ns) for p in files)
    with _lock:
        if _index is None or _index[0] != signature:
            parsed = [note for p in files if (note := _parse(p))]
            # Newest first; on a duplicate slug the newest file wins.
            parsed.sort(key=lambda n: n["date"], reverse=True)
            unique = {}
            for note in parsed:
                unique.setdefault(note["id"], note)
            _index = (signature, list(unique.values()))
        return _index[1]


def list_notes() -> list[dict]:
    try:
        return [{k: v for k, v in note.items() if k != "markdown"} for note in _notes()]
    except Exception as error:
        logger.error(f"Notes could not be listed ({type(error).__name__}: {error})")
        raise data_unavailable("Notes") from None


def get_note(note_id: str) -> dict | None:
    if len(note_id) > 80 or not SLUG.fullmatch(note_id):
        return None
    try:
        return next((note for note in _notes() if note["id"] == note_id), None)
    except Exception as error:
        logger.error(f"Note {note_id} could not be loaded ({type(error).__name__}: {error})")
        raise data_unavailable("Notes") from None
