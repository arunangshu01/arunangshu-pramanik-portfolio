import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from routers import health_check, personal_info
from utility.settings import API_COMMON_PREFIX, HOST, PORT, DEBUG_MODE

tags_metadata = [
    {
        "name": "Health Check",
        "description": "For API Health Check"
    },
    {
        "name": "Personal Information",
        "description": "Extract Personal Information"
    }
]

debug_mode = True if DEBUG_MODE == "True" else False

app = FastAPI(
    openapi_tags=tags_metadata,
    title="Arunangshu Pramanik's Personal Portfolio",
    docs_url=f"{API_COMMON_PREFIX}/docs",
    redoc_url=f"{API_COMMON_PREFIX}/redoc",
    debug=debug_mode
)

app.include_router(health_check.router, prefix=API_COMMON_PREFIX)
app.include_router(personal_info.router, prefix=API_COMMON_PREFIX)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == '__main__':
    uvicorn.run("app.main:app",
                host=HOST,
                port=PORT,
                access_log=True)
