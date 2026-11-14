import html as html_module
import json

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse

from model.base_models_errors import ErrorResponseModel
from utility.json_cache import get_json_data
from utility.settings import API_COMMON_PREFIX, SITE_URL, projects_file

router = APIRouter(tags=["Share"])

SITE_NAME = "Arunangshu Pramanik - Portfolio"


def _projects_by_id() -> dict:
    try:
        data = get_json_data(projects_file)
    except (OSError, ValueError):
        return {}
    return {project['id']: project for project in data}


@router.get('/share/{project_id}', response_class=HTMLResponse, status_code=status.HTTP_200_OK)
async def share_project(project_id: str):
    """OG-tag page for one project: crawlers read the tags, humans are redirected."""
    project = _projects_by_id().get(project_id)
    if project is None:
        detail = ErrorResponseModel(error_message='Unknown project.',
                                    error_type='NotFound')
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail.model_dump())
    target = f'{SITE_URL}/#projects'
    image = project.get('image')
    image_url = f'{SITE_URL}{image}' if image else f'{SITE_URL}/og-image.png'
    title = html_module.escape(f"{project['name']} | {SITE_NAME}")
    description = html_module.escape(project['description'][:200])
    escaped_target = html_module.escape(target)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<meta name="description" content="{description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{SITE_NAME}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{image_url}" />
<meta property="og:url" content="{SITE_URL}{API_COMMON_PREFIX}/share/{html_module.escape(project_id)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{image_url}" />
<meta http-equiv="refresh" content="0; url={escaped_target}" />
</head>
<body>
<p>Redirecting to <a href="{escaped_target}">{title}</a>&hellip;</p>
<script>window.location.replace({json.dumps(target)});</script>
</body>
</html>"""


@router.get('/share', status_code=status.HTTP_307_TEMPORARY_REDIRECT)
async def share_index():
    return RedirectResponse(url=f'{SITE_URL}/')
