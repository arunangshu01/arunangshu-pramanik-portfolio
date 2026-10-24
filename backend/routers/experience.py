from fastapi import APIRouter, status
from source.experience_extract import ExperienceGenerator

router = APIRouter(tags=["Experience"])


@router.get('/experience', status_code=status.HTTP_200_OK)
async def fetch_experience():
    experience = ExperienceGenerator()
    response = experience.display_experience()
    return response
