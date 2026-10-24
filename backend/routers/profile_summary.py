from fastapi import APIRouter, status
from source.profile_summary_extract import ProfileSummaryGenerator

router = APIRouter(tags=["Profile Summary"])


@router.get('/profile_summary', status_code=status.HTTP_200_OK)
async def fetch_profile_summary():
    profile_summary = ProfileSummaryGenerator()
    response = profile_summary.display_profile_summary()
    return response
