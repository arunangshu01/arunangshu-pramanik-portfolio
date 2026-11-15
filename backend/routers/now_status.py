import secrets

from fastapi import APIRouter, Header, HTTPException, Request, Response, status

from model.base_models_errors import ErrorResponseModel
from model.base_models_now_status import NowStatus
from source.now_status import get_now_status, update_now_status
from utility.client_ip import client_ip
from utility.logger import Logger
from utility.settings import ANALYTICS_ADMIN_TOKEN

logger = Logger(__name__)

router = APIRouter(tags=["Now Status"])


def _error(status_code: int, error_type: str, error_message: str):
    error_detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=error_detail.model_dump())


@router.get('/status', response_model=NowStatus, status_code=status.HTTP_200_OK)
async def fetch_status(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=60'
    return get_now_status()


@router.put('/status', response_model=NowStatus, status_code=status.HTTP_200_OK)
async def put_status(update: NowStatus, request: Request,
                     x_admin_token: str = Header(default="")):
    if not ANALYTICS_ADMIN_TOKEN:
        _error(status.HTTP_503_SERVICE_UNAVAILABLE, "NotConfigured",
               "Error: Status updates are not enabled on this server.")
    if not secrets.compare_digest(x_admin_token, ANALYTICS_ADMIN_TOKEN):
        logger.warning(f"Unauthorized status update from {client_ip(request)}")
        _error(status.HTTP_401_UNAUTHORIZED, "Unauthorized",
               "Error: Invalid or missing admin token.")
    return update_now_status(update)
