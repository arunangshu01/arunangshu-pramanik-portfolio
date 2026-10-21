# Arunangshu Pramanik - Portfolio Frontend

Personal portfolio website - an Iron Man / J.A.R.V.I.S.-themed single-page React app
serving resume data from the companion FastAPI backend.

**Live site:** https://arunangshu-pramanik-portfolio-frontend.onrender.com/

**Backend API docs (Swagger):** https://arunangshu-pramanik-portfolio.onrender.com/arunangshu_pramanik/portfolio/v1/docs

## Highlights

- J.A.R.V.I.S. boot sequence, arc-reactor animations, HUD grid, shimmer typography
- Skills grid with real brand icons, animated experience timeline, awards wall
- Contact form wired to the backend's `/send_email` (handles the `429` rate limit)
- View / download resume via the backend's `/resume/view` and `/resume/download`
- Light/dark theme toggle (arc reactor / mask), fully responsive from 320px phones to desktops
- Optional ambient synthwave score (`public/ambient.m4a`, synthesized in-repo)

## Stack

React 18 (CRA) · Tailwind CSS · Framer Motion · react-icons

## Backend API

Data comes from the FastAPI service:

- Local: copy `.env.example` to `.env.development.local` (gitignored) and set
  `API_PROXY_TARGET` to the backend origin (e.g. `http://localhost:8080`).
  `src/setupProxy.js` forwards `/arunangshu_pramanik/*` there, so no CORS setup is needed.
- Prod: set `REACT_APP_API_BASE` to the deployed API base URL

GET endpoints return JSON, except `/resume/view` and `/resume/download` which return
a PDF and are used as plain links. `POST /send_email` expects `multipart/form-data`
and is rate-limited per IP (`429` is surfaced as "please try again later").

Analytics: the site sends fire-and-forget JSON events to `POST /analytics/track`
(`page_view`, `section_view`, `cta_click`, `social_click`, `theme_toggle`, `music_play`).
Resume views/downloads and contact submissions are tracked by the backend itself.
Events are sent from production builds only; set `REACT_APP_ENABLE_ANALYTICS=true`
to send them from `npm start`. `GET /analytics/summary` is admin-only and not used here.
See `API_DOCUMENTATION.md` in the backend repo for the full contract.

> CORS note: the backend must list this site's origin in its `CORS_ORIGINS`
> env var, otherwise production requests are blocked by the browser.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server on :3000 (proxies API calls to `API_PROXY_TARGET`) |
| `npm test` | CRA test runner |
| `npm run build` | Production build into `build/` |
| `python3 scripts/gen_ambient.py` | Regenerate the ambient loop WAV |
| `afconvert -f m4af -d aac -b 96000 /tmp/ambient.wav public/ambient.m4a` | Encode it to AAC |

## Deploy (Render)

Static site - build `npm install && npm run build`, publish dir `build`,
env `REACT_APP_API_BASE=<backend base URL>`, rewrite rule `/* → /index.html`.
