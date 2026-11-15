import secrets

from fastapi import HTTPException, Request, status

from model.base_models_errors import ErrorResponseModel
from utility.client_ip import client_ip
from utility.logger import Logger
from utility.settings import ANALYTICS_ADMIN_TOKEN

logger = Logger(__name__)


def _raise(status_code: int, error_type: str, error_message: str):
    detail = ErrorResponseModel(error_message=error_message, error_type=error_type)
    raise HTTPException(status_code=status_code, detail=detail.model_dump())


def require_admin(request: Request, token: str, feature: str) -> None:
    """503 when no admin token is configured, 401 on a missing/wrong token."""
    if not ANALYTICS_ADMIN_TOKEN:
        _raise(status.HTTP_503_SERVICE_UNAVAILABLE, "NotConfigured",
               f"Error: {feature} are not enabled on this server.")
    if not secrets.compare_digest(token.encode(), ANALYTICS_ADMIN_TOKEN.encode()):
        logger.warning(f"Unauthorized admin request for {request.url.path} from {client_ip(request)}")
        _raise(status.HTTP_401_UNAUTHORIZED, "Unauthorized",
               "Error: Invalid or missing admin token.")


def unavailable(feature: str):
    _raise(status.HTTP_503_SERVICE_UNAVAILABLE, "StorageUnavailable",
           f"Error: {feature} is temporarily unavailable.")
