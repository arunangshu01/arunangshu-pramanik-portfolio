from fastapi import APIRouter, HTTPException, Response, status

from model.base_models_errors import ErrorResponseModel
from source.coding_activity import github_activity, leetcode_stats

router = APIRouter(tags=["Coding Activity"])


def _unavailable(kind: str):
    detail = ErrorResponseModel(
        error_message=f'{kind} activity is currently unavailable.',
        error_type='ActivityUnavailable')
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=detail.model_dump())


@router.get('/github_activity', status_code=status.HTTP_200_OK)
async def get_github_activity(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    data = await github_activity()
    if data is None:
        _unavailable('GitHub')
    return data


@router.get('/leetcode_stats', status_code=status.HTTP_200_OK)
async def get_leetcode_stats(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    data = await leetcode_stats()
    if data is None:
        _unavailable('LeetCode')
    return data
