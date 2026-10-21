import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from model.base_models_errors import ErrorResponseModel
from utility.settings import resume_file
from utility.logger import Logger

logger = Logger(__name__)

router = APIRouter(tags=["Resume"])

RESUME_FILENAME = "Arunangshu_Pramanik_CV.pdf"


def _resume_response(content_disposition: str) -> FileResponse:
    if not os.path.exists(resume_file):
        error_message = "Error: Resume file is currently unavailable. Please try again later."
        logger.error(f"{error_message} (FileNotFoundError: {resume_file})")
        error_detail = ErrorResponseModel(
            error_message=error_message,
            error_type="FileNotFoundError"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_detail.model_dump())
    return FileResponse(
        path=resume_file,
        media_type="application/pdf",
        filename=RESUME_FILENAME,
        content_disposition_type=content_disposition
    )


@router.get('/resume/view', status_code=status.HTTP_200_OK)
async def view_resume():
    return _resume_response("inline")


@router.get('/resume/download', status_code=status.HTTP_200_OK)
async def download_resume():
    return _resume_response("attachment")
