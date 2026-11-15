from fastapi import APIRouter, HTTPException, Response, status

from model.base_models_errors import ErrorResponseModel
from source.notes import get_note, list_notes

router = APIRouter(tags=["Notes"])


@router.get('/notes', status_code=status.HTTP_200_OK)
async def fetch_notes(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=60'
    return {"notes": list_notes()}


@router.get('/notes/{note_id}', status_code=status.HTTP_200_OK)
async def fetch_note(note_id: str, response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    note = get_note(note_id)
    if note is None:
        detail = ErrorResponseModel(
            error_message="Note not found.", error_type="NoteNotFound")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=detail.model_dump())
    return note
