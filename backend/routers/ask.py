from fastapi import APIRouter, HTTPException, Request, status

from model.base_models_ask import AskRequest, AskResponse
from model.base_models_errors import ErrorResponseModel
from source.ask_assistant import ask, assistant_configured
from utility.client_ip import client_ip
from utility.logger import Logger
from utility.rate_limit import InMemoryRateLimiter
from utility.view_counter import record_public_event
from utility.settings import ASK_RATE_LIMIT_MAX_REQUESTS, ASK_RATE_LIMIT_WINDOW_SECONDS, \
    ASK_RATE_LIMIT_GLOBAL_MAX_REQUESTS

logger = Logger(__name__)

router = APIRouter(tags=["Ask"])

rate_limiter = InMemoryRateLimiter(
    max_requests=ASK_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=ASK_RATE_LIMIT_WINDOW_SECONDS,
    global_max_requests=ASK_RATE_LIMIT_GLOBAL_MAX_REQUESTS,
)


def _error(status_code: int, error_type: str, error_message: str):
    detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=detail.model_dump())


@router.get('/ask/status', status_code=status.HTTP_200_OK)
async def ask_status():
    # No data disclosure beyond enabled/disabled - the widget hides itself when off.
    return {"enabled": assistant_configured()}


@router.post('/ask', response_model=AskResponse, status_code=status.HTTP_200_OK)
async def ask_question(body: AskRequest, request: Request):
    if not assistant_configured():
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "NotConfigured",
               "Error: The assistant is not enabled on this server.")
    client = client_ip(request)
    if not rate_limiter.allow(client):
        _error(status.HTTP_429_TOO_MANY_REQUESTS, "RateLimitExceeded",
               "Error: Too many questions. Please try again later.")
    try:
        answer = await ask(body.question)
    except Exception:
        logger.warning("Ask-assistant request failed unexpectedly")
        answer = None
    if answer is None:
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "AssistantUnavailable",
               "Error: The assistant is temporarily unavailable. Please try again later.")
    record_public_event("ask_question")
    return AskResponse(answer=answer)
