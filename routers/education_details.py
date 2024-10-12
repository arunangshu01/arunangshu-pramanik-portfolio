from fastapi import APIRouter, status
from source.education_details_extract import EducationDetailsGenerator

router = APIRouter(tags=["Education Details"])


@router.get('/education_details', status_code=status.HTTP_200_OK)
async def fetch_education_details():
    education_details = EducationDetailsGenerator()
    response = education_details.display_education_details()
    return response
