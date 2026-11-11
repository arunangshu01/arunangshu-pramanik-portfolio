import secrets
from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from model.base_models_analytics import AnalyticsEvent, AnalyticsTrackSuccess, ViewPresence, \
    PublicViewStats, PublicDashboard, PUBLIC_EVENTS
from source.projects_extract import known_project_ids
from utility.view_counter import view_counter
from model.base_models_errors import ErrorResponseModel
from utility.analytics import tracker
from utility.client_ip import client_ip
from utility.logger import Logger
from utility.rate_limit import InMemoryRateLimiter
from utility.settings import ANALYTICS_ADMIN_TOKEN, ANALYTICS_RATE_LIMIT_MAX_REQUESTS, \
    ANALYTICS_RATE_LIMIT_WINDOW_SECONDS, ANALYTICS_RATE_LIMIT_GLOBAL_MAX_REQUESTS

logger = Logger(__name__)

router = APIRouter(tags=["Analytics"])

rate_limiter = InMemoryRateLimiter(
    max_requests=ANALYTICS_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=ANALYTICS_RATE_LIMIT_WINDOW_SECONDS,
    global_max_requests=ANALYTICS_RATE_LIMIT_GLOBAL_MAX_REQUESTS
)
view_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60, global_max_requests=600)
dashboard_rate_limiter = InMemoryRateLimiter(max_requests=30, window_seconds=60, global_max_requests=600)


def _error(status_code: int, error_type: str, error_message: str):
    error_detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=error_detail.model_dump())


def _too_many(detail: str):
    return JSONResponse(status_code=429, content={"detail": detail},
                        headers={"Cache-Control": "no-store", "Retry-After": "60"})


@router.post('/analytics/track', status_code=status.HTTP_201_CREATED)
async def track_event(event: AnalyticsEvent, request: Request):
    client = client_ip(request)
    if not rate_limiter.allow(client):
        _error(status.HTTP_429_TOO_MANY_REQUESTS, "RateLimitExceeded",
               "Error: Too many analytics events. Please try again later.")
    tracker.track(
        event=event.event,
        page=event.page,
        client=client,
        metadata=event.metadata
    )
    project = (event.metadata or {}).get("project")
    try:
        view_counter.record_event(event.event, project if project in known_project_ids() else None)
    except Exception:
        logger.warning(f"Failed to persist public event counter for {event.event}")
    return AnalyticsTrackSuccess(message="Event tracked.").model_dump()


@router.get('/analytics/summary', status_code=status.HTTP_200_OK)
async def analytics_summary(request: Request, recent: int = 20,
                            x_admin_token: str = Header(default="")):
    if not ANALYTICS_ADMIN_TOKEN:
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "NotConfigured",
               "Error: Analytics summary is not enabled on this server.")
    if not secrets.compare_digest(x_admin_token, ANALYTICS_ADMIN_TOKEN):
        logger.warning(f"Unauthorized analytics summary request from {client_ip(request)}")
        _error(status.HTTP_401_UNAUTHORIZED, "Unauthorized",
               "Error: Invalid or missing admin token.")
    return tracker.summary(recent=max(1, min(recent, 500)))


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
    if not view_rate_limiter.allow(client_ip(request)):
        return _too_many("Too many presence requests")
    return _view_stats(lambda: view_counter.heartbeat(str(event.view_id), str(event.session_id)))


def _public_dashboard():
    # Filter on read too, so entries stored before the allowlist existed stay hidden.
    board = view_counter.dashboard()
    projects = known_project_ids()
    board["events"] = {key: count for key, count in board["events"].items() if key in PUBLIC_EVENTS}
    board["projects"] = {key: counts for key, counts in board["projects"].items() if key in projects}
    return board


@router.get('/analytics/dashboard', response_model=PublicDashboard)
def public_dashboard(request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    if not dashboard_rate_limiter.allow(client_ip(request)):
        return _too_many("Too many dashboard requests")
    return _view_stats(_public_dashboard)
