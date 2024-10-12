from fastapi import APIRouter, status
from utility.settings import logger

router = APIRouter(tags=["Health Check"])


@router.get('/health', status_code=status.HTTP_200_OK)
async def health_check():
    logger.info("Health Check is OK. Status Code: 200.")
    health_check_dict = {
        "status": "OK",
        "code": 200
    }
    return health_check_dict
