from fastapi import APIRouter, HTTPException, Response, status

from model.base_models_errors import ErrorResponseModel
from source.coding_activity import github_activity, github_feed, github_wrapped, \
    leetcode_stats, repo_health

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


@router.get('/github_feed', status_code=status.HTTP_200_OK)
async def get_github_feed(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    data = await github_feed()
    if data is None:
        _unavailable('GitHub')
    return data


@router.get('/github_wrapped', status_code=status.HTTP_200_OK)
async def get_github_wrapped(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    data = await github_wrapped()
    if data is None:
        _unavailable('GitHub')
    return data


@router.get('/repo_health', status_code=status.HTTP_200_OK)
async def get_repo_health(response: Response):
    response.headers['Cache-Control'] = 'public, max-age=300'
    data = await repo_health()
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
