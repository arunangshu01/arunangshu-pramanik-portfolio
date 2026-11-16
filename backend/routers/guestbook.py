import re

from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from model.base_models_errors import ErrorResponseModel
from model.base_models_guestbook import GuestbookEntry, GuestbookList, GuestbookPostSuccess
from utility.admin_auth import require_admin, unavailable
from utility.client_ip import client_ip
from utility.guestbook import guestbook_store
from utility.logger import Logger
from utility.rate_limit import InMemoryRateLimiter
from utility.settings import (
    GUESTBOOK_MAX_ENTRIES,
    GUESTBOOK_RATE_LIMIT_GLOBAL_MAX_REQUESTS,
    GUESTBOOK_RATE_LIMIT_MAX_REQUESTS,
    GUESTBOOK_RATE_LIMIT_WINDOW_SECONDS,
)

logger = Logger(__name__)

router = APIRouter(tags=["Guestbook"])

rate_limiter = InMemoryRateLimiter(
    max_requests=GUESTBOOK_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=GUESTBOOK_RATE_LIMIT_WINDOW_SECONDS,
    global_max_requests=GUESTBOOK_RATE_LIMIT_GLOBAL_MAX_REQUESTS,
)
ENTRY_ID = re.compile(r"[A-Za-z0-9_-]{1,64}")
THANKS = "Thanks for signing the guestbook!"


@router.get('/guestbook', response_model=GuestbookList, status_code=status.HTTP_200_OK)
async def list_entries(response: Response, limit: int = GUESTBOOK_MAX_ENTRIES):
    response.headers['Cache-Control'] = 'public, max-age=30'
    try:
        entries = guestbook_store.entries(max(1, min(limit, GUESTBOOK_MAX_ENTRIES)))
    except Exception:
        logger.warning("Guestbook read failed")
        unavailable("Guestbook")
    return {"entries": entries}


@router.post('/guestbook', response_model=GuestbookPostSuccess,
             status_code=status.HTTP_201_CREATED)
async def sign_guestbook(entry: GuestbookEntry, request: Request):
    if not rate_limiter.allow(client_ip(request)):
        return JSONResponse(status_code=429,
                            content={"detail": "Too many guestbook entries. Please try again later."},
                            headers={"Cache-Control": "no-store", "Retry-After": "60"})
    if entry.website:
        # Honeypot tripped: look successful to the bot, store nothing.
        logger.info(f"Guestbook honeypot triggered from {client_ip(request)}")
        return {"message": THANKS, "entry": None}
    try:
        created = guestbook_store.add(entry.name, entry.message)
    except Exception:
        logger.warning("Guestbook write failed")
        unavailable("Guestbook")
    return {"message": THANKS, "entry": created}


@router.delete('/guestbook/{entry_id}', status_code=status.HTTP_200_OK)
async def delete_entry(entry_id: str, request: Request, x_admin_token: str = Header(default="")):
    """Moderation: remove an entry. Requires X-Admin-Token."""
    require_admin(request, x_admin_token, "Guestbook moderation")
    if not ENTRY_ID.fullmatch(entry_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ErrorResponseModel(
            error_message="Entry not found.", error_type="EntryNotFound").model_dump())
    try:
        deleted = guestbook_store.delete(entry_id)
    except Exception:
        logger.warning("Guestbook delete failed")
        unavailable("Guestbook")
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ErrorResponseModel(
            error_message="Entry not found.", error_type="EntryNotFound").model_dump())
    return {"message": "Entry deleted.", "id": entry_id}
