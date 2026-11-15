from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from model.base_models_errors import ErrorResponseModel
from model.base_models_guestbook import GuestbookEntry, GuestbookPostSuccess
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


def _error(status_code: int, error_type: str, error_message: str):
    error_detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=error_detail.model_dump())


@router.get('/guestbook', status_code=status.HTTP_200_OK)
async def list_entries(response: Response, limit: int = GUESTBOOK_MAX_ENTRIES):
    response.headers['Cache-Control'] = 'public, max-age=60'
    try:
        entries = guestbook_store.list(max(1, min(limit, GUESTBOOK_MAX_ENTRIES)))
    except Exception:
        logger.warning("Guestbook read failed")
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "GuestbookUnavailable",
               "Error: Guestbook is temporarily unavailable.")
    return {"entries": entries}


@router.post('/guestbook', response_model=GuestbookPostSuccess,
             status_code=status.HTTP_201_CREATED)
async def sign_guestbook(entry: GuestbookEntry, request: Request):
    if not rate_limiter.allow(client_ip(request)):
        return JSONResponse(status_code=429,
                            content={"detail": "Too many guestbook entries. Please try again later."},
                            headers={"Cache-Control": "no-store", "Retry-After": "60"})
    try:
        guestbook_store.add(entry.name, entry.message)
    except Exception:
        logger.warning("Guestbook write failed")
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "GuestbookUnavailable",
               "Error: Guestbook is temporarily unavailable.")
    return GuestbookPostSuccess(message="Thanks for signing the guestbook!").model_dump()
