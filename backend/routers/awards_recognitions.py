from fastapi import APIRouter, status
from source.awards_recognitions_extract import AwardsRecognitionsGenerator

router = APIRouter(tags=["Awards & Recognitions"])


@router.get('/awards_recognitions', status_code=status.HTTP_200_OK)
async def fetch_awards_recognitions():
    awards_recognitions = AwardsRecognitionsGenerator()
    response = awards_recognitions.display_awards_recognitions()
    return response
