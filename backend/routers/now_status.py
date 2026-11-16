from fastapi import APIRouter, Header, Request, Response, status

from model.base_models_now_status import NowStatus
from source.now_status import get_now_status, reset_now_status, update_now_status
from utility.admin_auth import require_admin, unavailable
from utility.logger import Logger

logger = Logger(__name__)

router = APIRouter(tags=["Now Status"])


@router.get('/status', response_model=NowStatus, status_code=status.HTTP_200_OK)
async def fetch_status(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=60'
    return get_now_status()


@router.put('/status', response_model=NowStatus, status_code=status.HTTP_200_OK)
async def put_status(update: NowStatus, request: Request,
                     x_admin_token: str = Header(default="")):
    require_admin(request, x_admin_token, "Status updates")
    try:
        return update_now_status(update)
    except Exception:
        logger.warning("Now-status update could not be stored")
        unavailable("Status storage")


@router.delete('/status', response_model=NowStatus, status_code=status.HTTP_200_OK)
async def delete_status(request: Request, x_admin_token: str = Header(default="")):
    """Clear the override and fall back to the committed now_status.json."""
    require_admin(request, x_admin_token, "Status updates")
    try:
        return reset_now_status()
    except Exception:
        logger.warning("Now-status override could not be cleared")
        unavailable("Status storage")
