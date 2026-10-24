from fastapi import APIRouter, status
from source.personal_info_extract import PersonalInformationGenerator

router = APIRouter(tags=["Personal Information"])


@router.get('/personal_info', status_code=status.HTTP_200_OK)
async def fetch_personal_info():
    personal_info = PersonalInformationGenerator()
    response = personal_info.display_personal_info()
    return response
