import secrets
from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from model.base_models_analytics import AnalyticsEvent, AnalyticsTrackSuccess, ViewPresence, PublicViewStats
from utility.view_counter import view_counter
from model.base_models_errors import ErrorResponseModel
from utility.analytics import tracker
from utility.logger import Logger
from utility.rate_limit import InMemoryRateLimiter
from utility.settings import ANALYTICS_ADMIN_TOKEN, ANALYTICS_RATE_LIMIT_MAX_REQUESTS, \
    ANALYTICS_RATE_LIMIT_WINDOW_SECONDS

logger = Logger(__name__)

router = APIRouter(tags=["Analytics"])

rate_limiter = InMemoryRateLimiter(
    max_requests=ANALYTICS_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=ANALYTICS_RATE_LIMIT_WINDOW_SECONDS
)


def _error(status_code: int, error_type: str, error_message: str):
    error_detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=error_detail.model_dump())


@router.post('/analytics/track', status_code=status.HTTP_201_CREATED)
async def track_event(event: AnalyticsEvent, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.allow(client_ip):
        _error(status.HTTP_429_TOO_MANY_REQUESTS, "RateLimitExceeded",
               "Error: Too many analytics events. Please try again later.")
    tracker.track(
        event=event.event,
        page=event.page,
        client=client_ip,
        metadata=event.metadata
    )
    return AnalyticsTrackSuccess(message="Event tracked.").model_dump()


@router.get('/analytics/summary', status_code=status.HTTP_200_OK)
async def analytics_summary(request: Request, recent: int = 20,
                            x_admin_token: str = Header(default="")):
    if not ANALYTICS_ADMIN_TOKEN:
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "NotConfigured",
               "Error: Analytics summary is not enabled on this server.")
    if not secrets.compare_digest(x_admin_token, ANALYTICS_ADMIN_TOKEN):
        logger.warning(f"Unauthorized analytics summary request from {request.client.host if request.client else 'unknown'}")
        _error(status.HTTP_401_UNAUTHORIZED, "Unauthorized",
               "Error: Invalid or missing admin token.")
    return tracker.summary(recent=max(1, min(recent, 500)))


view_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)


def _view_stats(operation):
    try:
        return operation()
    except Exception:
        logger.warning("Public view statistics are temporarily unavailable")
        return JSONResponse(status_code=503, content={"detail": "View statistics unavailable"},
                            headers={"Cache-Control": "no-store"})


@router.get('/analytics/views', response_model=PublicViewStats)
def public_view_stats(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return _view_stats(view_counter.stats)


@router.post('/analytics/views', response_model=PublicViewStats)
def view_presence(event: ViewPresence, request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    client_ip = request.client.host if request.client else "unknown"
    if not view_rate_limiter.allow(client_ip):
        return JSONResponse(status_code=429, content={"detail": "Too many presence requests"},
                            headers={"Cache-Control": "no-store", "Retry-After": "60"})
    return _view_stats(lambda: view_counter.heartbeat(str(event.view_id), str(event.session_id)))
