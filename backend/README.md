# Arunangshu Pramanik - Portfolio Backend

FastAPI service powering the portfolio frontend - serves resume/portfolio data
from static JSON files and dispatches contact-form emails in the background.

**Live API docs (Swagger):** https://arunangshu-pramanik-portfolio.onrender.com/arunangshu_pramanik/portfolio/v1/docs

**Frontend (React):** https://arunangshu-pramanik-portfolio-frontend.onrender.com/

Full endpoint reference: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

## Stack

Python 3.12 · FastAPI · Pydantic · Uvicorn

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/personal_info` | Name, phone, location, social profiles |
| GET | `/profile_summary` | Professional summary |
| GET | `/education_details` | Degree, institution, DGPA |
| GET | `/skills` | Categorized skill lists |
| GET | `/experience` | Roles + responsibilities |
| GET | `/awards_recognitions` | Awards list |
| GET | `/resume/view` | Resume PDF, inline in browser |
| GET | `/resume/download` | Resume PDF, downloads as attachment |
| POST | `/send_email` | Contact form → email (multipart form, rate-limited) |
| POST | `/analytics/track` | Record a frontend event (JSON body, rate-limited) |
| GET | `/analytics/summary` | Event counts (`X-Admin-Token` header required) |

All paths sit under the prefix `/arunangshu_pramanik/portfolio/v1`.

## Configuration

Environment variables (see `utility/settings.py`):

| Var | Purpose |
|---|---|
| `HOST` / `PORT` | Bind address (default `0.0.0.0:8080`) |
| `DEBUG_MODE` | FastAPI debug flag |
| `CORS_ORIGINS` | Comma-separated allowed origins - **required** for the frontend to call the API from the browser, e.g. `https://arunangshu-pramanik-portfolio-frontend.onrender.com,http://localhost:3000` |
| `BREVO_API_KEY` | Brevo API key used by `/send_email` (sent over HTTPS - Render free instances block SMTP ports) |
| `MAIL_FROM` | Sender address - must be a verified sender in Brevo |
| `RECEIVER_EMAIL` | Inbox that receives contact-form messages |
| `EMAIL_RATE_LIMIT_MAX_REQUESTS` / `EMAIL_RATE_LIMIT_WINDOW_SECONDS` | `/send_email` rate limit per IP (default `3` / `3600`) |
| `ANALYTICS_ADMIN_TOKEN` | Token required on `X-Admin-Token` for `/analytics/summary` - if unset, the endpoint returns `503` |
| `ANALYTICS_RATE_LIMIT_MAX_REQUESTS` / `ANALYTICS_RATE_LIMIT_WINDOW_SECONDS` | `/analytics/track` rate limit per IP (default `30` / `60`) |

## Getting Started

```sh
git clone https://github.com/arunangshu01/arunangshu-pramanik-portfolio.git
cd arunangshu-pramanik-portfolio
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger UI then lives at `http://localhost:8080/arunangshu_pramanik/portfolio/v1/docs`.

## Deploy (Render)

Web service - `Procfile` provides the start command. Set the env vars above,
then redeploy after any change to `information/*.json` or `assets/` (they ship
with the repo; at runtime the JSON is served from an in-memory cache that
reloads when a file changes).

## Tests

```sh
python -m pytest tests -v
```

Covers all endpoints, rate limiting, and analytics (Brevo calls are mocked).
CI runs the same suite via `.github/workflows/ci.yml` on push/PR.

## Let's Connect

- 📧 **Email:** arunangshu01@gmail.com
- 🔗 [**LinkedIn**](https://www.linkedin.com/in/arunangshu-pramanik-1896168b/)
