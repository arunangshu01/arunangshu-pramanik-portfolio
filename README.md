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
| POST | `/send_email` | Contact form → email (multipart form) |

All paths sit under the prefix `/arunangshu_pramanik/portfolio/v1`.

## Configuration

Environment variables (see `utility/settings.py`):

| Var | Purpose |
|---|---|
| `HOST` / `PORT` | Bind address (default `0.0.0.0:8080`) |
| `DEBUG_MODE` | FastAPI debug flag |
| `CORS_ORIGINS` | Comma-separated allowed origins - **required** for the frontend to call the API from the browser, e.g. `https://arunangshu-pramanik-portfolio-frontend.onrender.com,http://localhost:3000` |
| `RECEIVER_EMAIL` / `RECEIVER_PASSWORD` | SMTP credentials for `/send_email` |
| `EMAIL_SERVER` / `EMAIL_PORT` / `EMAIL_STARTTLS` / `EMAIL_SSL_TLS` | SMTP transport |
| `USE_CREDENTIALS` / `VALIDATE_CERTS` | SMTP auth/TLS toggles |

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
then redeploy after any change to `information/*.json` (data loads at startup).

## Let's Connect

- 📧 **Email:** arunangshu01@gmail.com
- 🔗 [**LinkedIn**](https://www.linkedin.com/in/arunangshu-pramanik-1896168b/)
