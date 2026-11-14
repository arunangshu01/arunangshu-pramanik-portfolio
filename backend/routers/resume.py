import os
import html as html_module
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse, HTMLResponse
from model.base_models_errors import ErrorResponseModel
from utility.analytics import tracker
from utility.client_ip import client_ip
from utility.json_cache import get_json_data
from utility.view_counter import record_public_event
from utility.settings import resume_file, personal_info_file, experience_file, \
    skills_file, projects_file
from utility.logger import Logger

logger = Logger(__name__)

router = APIRouter(tags=["Resume"])

RESUME_FILENAME = "Arunangshu_Pramanik_CV.pdf"
INFORMATION_DIR = os.path.dirname(personal_info_file)


def _resume_response(content_disposition: str) -> FileResponse:
    if not os.path.exists(resume_file):
        error_message = "Error: Resume file is currently unavailable. Please try again later."
        logger.error(f"{error_message} (FileNotFoundError: {resume_file})")
        error_detail = ErrorResponseModel(
            error_message=error_message,
            error_type="ResumeUnavailable"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_detail.model_dump())
    return FileResponse(
        path=resume_file,
        media_type="application/pdf",
        filename=RESUME_FILENAME,
        content_disposition_type=content_disposition
    )


@router.get('/resume/view', status_code=status.HTTP_200_OK)
async def view_resume(request: Request):
    response = _resume_response("inline")
    tracker.track(event="resume_view", client=client_ip(request))
    record_public_event("resume_view")
    return response


@router.get('/resume/download', status_code=status.HTTP_200_OK)
async def download_resume(request: Request):
    response = _resume_response("attachment")
    tracker.track(event="resume_download", client=client_ip(request))
    record_public_event("resume_download")
    return response


def _load(name: str):
    try:
        return get_json_data(os.path.join(INFORMATION_DIR, name))
    except (OSError, ValueError):
        return None


def _esc(value) -> str:
    return html_module.escape(str(value))


def _flatten_skills(skills: dict) -> list[str]:
    flat = []
    for value in skills.values():
        if isinstance(value, dict):
            flat.extend(_flatten_skills(value))
        elif isinstance(value, list):
            flat.extend(str(item) for item in value)
    return flat


def _print_resume_html() -> str:
    info = _load('personal_info.json')
    if info is None:
        detail = ErrorResponseModel(error_message='Resume is currently unavailable.',
                                    error_type='ResumeUnavailable')
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail.model_dump())
    summary = (_load('profile_summary.json') or {}).get('summary')
    education = (_load('education_details.json') or {}).get('education') or {}
    awards = (_load('awards_recognitions.json') or {}).get('awards') or []
    experience = (_load('experience.json') or {}).get('experience') or []
    skills = _flatten_skills((_load('skills.json') or {}).get('skills') or {})
    projects = _load('projects.json') or []

    def award_periods(award):
        period = award.get('timeline_period')
        return ', '.join(period) if isinstance(period, list) else (period or '')

    sections = []
    if summary:
        sections.append(f'<h2>Summary</h2><p>{_esc(summary)}</p>')
    if experience:
        jobs = ''.join(
            f'<div class="job"><p class="jobhead"><strong>{_esc(job["role"])}</strong> · {_esc(job["company"])}'
            f'<span class="duration">{_esc(job["duration"])}</span></p>'
            f'<p class="muted">{_esc(job.get("clients_or_customers", ""))}</p><ul>'
            + ''.join(f'<li>{_esc(item)}</li>' for item in job.get('responsibilities', []))
            + '</ul></div>'
            for job in experience)
        sections.append(f'<h2>Experience</h2>{jobs}')
    if projects:
        cards = ''.join(
            f'<div class="job"><p class="jobhead"><strong>{_esc(project["name"])}</strong>'
            f'<span class="duration">{_esc(project.get("duration") or "")}</span></p>'
            f'<p>{_esc(project["description"])}</p>'
            f'<p class="muted">{_esc(" · ".join(project.get("technologies", [])))}</p></div>'
            for project in projects)
        sections.append(f'<h2>Projects</h2>{cards}')
    if skills:
        sections.append(f'<h2>Skills</h2><p>{_esc(" · ".join(skills))}</p>')
    if education:
        sections.append(
            f'<h2>Education</h2><p class="jobhead"><strong>{_esc(education.get("degree", ""))}</strong>'
            f'<span class="duration">{_esc(education.get("duration", ""))}</span></p>'
            f'<p>{_esc(education.get("institution", ""))} · DGPA {_esc(education.get("dgpa", ""))}</p>')
    if awards:
        items = ''.join(
            f'<li>{_esc(award.get("award", ""))} — {_esc(award.get("organization", ""))}'
            f' <span class="muted">({award_periods(award)})</span></li>'
            for award in awards)
        sections.append(f'<h2>Awards &amp; Recognitions</h2><ul>{items}</ul>')

    socials = ' · '.join(_esc(url) for url in info.get('social_media_profiles', {}).values())
    location = info.get('location') or {}
    contact = ' · '.join(filter(None, [
        _esc(info.get('email', '')), _esc(info.get('phone', '')),
        _esc(', '.join(filter(None, [location.get('city'), location.get('state'), location.get('country')]))),
        socials]))
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>{_esc(info.get('name', 'Resume'))} - Resume</title>
<style>
body {{ font-family: Georgia, 'Times New Roman', serif; color: #111; max-width: 800px;
       margin: 2rem auto; padding: 0 1.25rem; line-height: 1.5; font-size: 14px; }}
h1 {{ font-size: 26px; margin: 0; }}
h2 {{ font-size: 13px; text-transform: uppercase; letter-spacing: .12em;
     border-bottom: 1px solid #999; padding-bottom: 3px; margin: 1.6rem 0 .6rem; }}
.jobhead {{ display: flex; justify-content: space-between; gap: 1rem; margin: .8rem 0 .2rem; }}
.duration {{ white-space: nowrap; color: #555; font-size: 12px; }}
.muted, ul {{ color: #333; }}
.job ul {{ margin: .3rem 0 .9rem; padding-left: 1.2rem; }}
a {{ color: #111; }}
#noprint {{ text-align: right; }}
#noprint button {{ font-size: 13px; padding: .4rem 1rem; cursor: pointer; }}
@media print {{ #noprint {{ display: none; }} body {{ margin: 0; font-size: 12px; }} }}
</style></head><body>
<div id="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
<h1>{_esc(info.get('name', ''))}</h1>
<p class="muted">{contact}</p>
{''.join(sections)}
</body></html>"""


@router.get('/resume/print', response_class=HTMLResponse, status_code=status.HTTP_200_OK)
async def print_resume(request: Request):
    """Print-friendly HTML resume rendered from the same data as the site."""
    response = _print_resume_html()
    tracker.track(event="resume_print", client=client_ip(request))
    record_public_event("resume_print")
    return HTMLResponse(response)
