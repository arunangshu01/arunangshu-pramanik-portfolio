import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health_check, personal_info, profile_summary, skills, education_details, experience, \
    awards_recognitions, send_email, resume, analytics, projects, ask, coding_activity, share
from utility.settings import API_COMMON_PREFIX, HOST, PORT, DEBUG_MODE, CORS_ORIGINS

tags_metadata = [
    {
        "name": "Health Check",
        "description": "For API Health Check"
    },
    {
        "name": "Personal Information",
        "description": "Extract Personal Information"
    },
    {
        "name": "Profile Summary",
        "description": "Extract Profile Summary"
    },
    {
        "name": "Education Details",
        "description": "Extract Education Details"
    },
    {
        "name": "Skills",
        "description": "Extract Skills"
    },
    {
        "name": "Experience",
        "description": "Extract Experience"
    },
    {
        "name": "Awards & Recognitions",
        "description": "Extract Awards & Recognitions"
    },
    {
        "name": "Drop Me A Message",
        "description": "Send an Email to me."
    },
    {
        "name": "Resume",
        "description": "View or Download Resume"
    },
    {
        "name": "Analytics",
        "description": "Track and summarize site events"
    },
    {
        "name": "Ask",
        "description": "Ask questions about me"
    },
    {
        "name": "Coding Activity",
        "description": "Public GitHub and LeetCode activity"
    },
    {
        "name": "Share",
        "description": "Per-project share links with Open Graph tags"
    }
]

debug_mode = True if DEBUG_MODE == "True" else False

app = FastAPI(
    openapi_tags=tags_metadata,
    title="Arunangshu Pramanik's Personal Portfolio",
    openapi_url=f"{API_COMMON_PREFIX}/openapi.json",
    docs_url=f"{API_COMMON_PREFIX}/docs",
    redoc_url=f"{API_COMMON_PREFIX}/redoc",
    debug=debug_mode
)

app.include_router(health_check.router, prefix=API_COMMON_PREFIX)
app.include_router(personal_info.router, prefix=API_COMMON_PREFIX)
app.include_router(profile_summary.router, prefix=API_COMMON_PREFIX)
app.include_router(education_details.router, prefix=API_COMMON_PREFIX)
app.include_router(skills.router, prefix=API_COMMON_PREFIX)
app.include_router(experience.router, prefix=API_COMMON_PREFIX)
app.include_router(awards_recognitions.router, prefix=API_COMMON_PREFIX)
app.include_router(send_email.router, prefix=API_COMMON_PREFIX)
app.include_router(resume.router, prefix=API_COMMON_PREFIX)
app.include_router(analytics.router, prefix=API_COMMON_PREFIX)
app.include_router(projects.router, prefix=API_COMMON_PREFIX)
app.include_router(ask.router, prefix=API_COMMON_PREFIX)
app.include_router(coding_activity.router, prefix=API_COMMON_PREFIX)
app.include_router(share.router, prefix=API_COMMON_PREFIX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Admin-Token"],
)

if __name__ == '__main__':
    uvicorn.run("app.main:app",
                host=HOST,
                port=PORT,
                access_log=True)
