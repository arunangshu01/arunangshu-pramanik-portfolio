from fastapi import APIRouter, status
from source.skills_extract import SkillsGenerator

router = APIRouter(tags=["Skills"])


@router.get('/skills', status_code=status.HTTP_200_OK)
async def fetch_skills():
    skills = SkillsGenerator()
    response = skills.display_skills()
    return response
