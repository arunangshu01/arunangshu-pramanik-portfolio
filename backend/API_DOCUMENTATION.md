# API Documentation - Portfolio Backend

REST API for the portfolio frontend. Built with FastAPI; serves resume/portfolio data from static JSON files and dispatches contact-form emails.

## Base URL

| Environment | Base URL |
|---|---|
| Local | `http://localhost:8080/arunangshu_pramanik/portfolio/v1` |
| Production | `https://arunangshu-pramanik-portfolio.web.app/arunangshu_pramanik/portfolio/v1` |

Production serves the frontend on Firebase Hosting; a Hosting rewrite proxies `/arunangshu_pramanik/**` to the `portfolio-api` Cloud Run service (`asia-south1`), so the API is same-origin in the browser.

All endpoints below are relative to the base URL.

## Interactive docs

- **Swagger UI:** `{base}/docs`
- **ReDoc:** `{base}/redoc`
- **OpenAPI schema:** `{host}/openapi.json` - note this lives at the server root, **not** under the `/arunangshu_pramanik/portfolio/v1` prefix.

## Conventions

- **Auth:** most endpoints are public. Admin endpoints (`/analytics/summary`, `/analytics/warehouse`, `PUT /status`) require the `X-Admin-Token` header matching the `ANALYTICS_ADMIN_TOKEN` env var; they return `503` when it isn't configured and `401` on a mismatch.
- **GET endpoints** return `application/json` with no request body, no query params - **except** the resume endpoints, which return `application/pdf`, and `/resume/print` + `/share/{project_id}`, which return `text/html`.
- **POST /send_email** consumes `multipart/form-data` (or `application/x-www-form-urlencoded`), **not** `application/json`. From the browser, use `FormData` - a JSON body returns `422`.
- **POST /send_email** is rate-limited per client IP (default **3 requests/hour**); exceeding it returns `429`.
- **Errors** are JSON (see [Error responses](#error-responses)).

### CORS - important for frontend setup

`CORSMiddleware` is configured with `allow_credentials=False`, `allow_methods=["GET", "POST"]`, `allow_headers=["Content-Type", "X-Admin-Token"]`, and `allow_origins` populated from the **`CORS_ORIGINS` env var** (comma-separated; defaults to `http://localhost:3000`).

The frontend origin **must be listed in `CORS_ORIGINS`** or browser requests are blocked. Production uses `CORS_ORIGINS=https://arunangshu-pramanik-portfolio.web.app,https://arunangshu-pramanik-portfolio.firebaseapp.com` (add the localhost origin too if needed for dev). Browser clients can't send `PUT`, so `PUT /status` is intended for server-side/curl use with the admin token.

For local dev, an alternative is adding `"proxy": "http://localhost:8080"` to `package.json` (CRA) and calling same-origin paths.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/personal_info` | Name, phone, location, email, social profiles |
| GET | `/profile_summary` | One-paragraph professional summary |
| GET | `/education_details` | Degree, institution, duration, DGPA |
| GET | `/skills` | Categorized skill lists |
| GET | `/experience` | List of roles with responsibilities |
| GET | `/awards_recognitions` | List of awards |
| GET | `/projects` | Project cards: technologies, highlights, preview settings |
| GET | `/resume/view` | Resume PDF, opens inline in browser |
| GET | `/resume/download` | Resume PDF, downloads as attachment |
| GET | `/resume/print` | Print-friendly HTML resume rendered from the site's data |
| GET | `/github_activity` | Cached GitHub profile stats and recent-event counts |
| GET | `/github_feed` | Cached changelog feed of recent public GitHub events |
| GET | `/github_wrapped` | 90-day GitHub aggregates: active days, streak, top repos |
| GET | `/repo_health` | Stars, issues, language, last push per showcased repo |
| GET | `/leetcode_stats` | Cached LeetCode solved counts and ranking |
| GET | `/status` | "Now playing" badge content from `information/now_status.json` |
| PUT | `/status` | Update the now-status JSON (admin token required) |
| GET | `/notes` | Note cards from `information/notes/*.md` (title, date, excerpt) |
| GET | `/notes/{note_id}` | Full markdown body of one note |
| GET | `/guestbook` | Recent guestbook entries (cached 60s) |
| POST | `/guestbook` | Sign the guestbook (rate-limited) |
| GET | `/share/{project_id}` | Per-project Open Graph page; redirects humans to `/#projects` |
| GET | `/ask/status` | Whether the ask-my-resume assistant is enabled |
| POST | `/ask` | Ask a question grounded in the portfolio data (rate-limited) |
| POST | `/send_email` | Contact form → email (multipart form, rate-limited) |
| POST | `/analytics/track` | Record a frontend event (JSON body, rate-limited) |
| GET | `/analytics/dashboard` | Public Stats aggregates: views, daily views, event/project counts |
| GET | `/analytics/summary` | In-memory event counts (admin token required) |
| GET | `/analytics/warehouse` | BigQuery event aggregates (admin token required) |
| GET | `/analytics/trends` | Public-safe BigQuery aggregates (cached 5 min) |
| GET | `/analytics/views` | Public aggregate total and estimated active sessions |
| POST | `/analytics/views` | Register a view or heartbeat with anonymous UUIDs |

---

### `GET /health`

Liveness/readiness probe. Returns `200 OK`.

**Response `200`**

```json
{
  "status": "OK",
  "code": 200
}
```

---

### `GET /personal_info`

**Response `200`** - `PersonalInformation`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Title-cased; must contain a space |
| `phone` | string | Format `+91-XXXXX-XXXXX` |
| `location.city` | string | |
| `location.state` | string | |
| `location.country` | string | |
| `email` | string | Valid email address |
| `social_media_profiles.linkedin` | string (URL) | |
| `social_media_profiles.github` | string (URL) | |
| `social_media_profiles.leetcode` | string (URL) | |

```json
{
  "name": "Arunangshu Pramanik",
  "phone": "+91-78906-69228",
  "location": {
    "city": "Bangalore (Bengaluru)",
    "state": "Karnataka",
    "country": "India"
  },
  "email": "arunangshu01@gmail.com",
  "social_media_profiles": {
    "linkedin": "https://www.linkedin.com/in/arunangshu-pramanik-1896168b",
    "github": "https://github.com/arunangshu01",
    "leetcode": "https://leetcode.com/u/arunangshu01"
  }
}
```

---

### `GET /profile_summary`

**Response `200`** - `ProfileSummary`

| Field | Type | Notes |
|---|---|---|
| `summary` | string | ≤ 500 chars |

```json
{
  "summary": "Software Engineer with over 7+ years of experience in Data and Cloud Services Architecture, a passion for Python and Azure, and a proven track record of delivering high-quality solutions with skills in designing, developing, and maintaining Data Solutions and SaaS applications."
}
```

---

### `GET /education_details`

**Response `200`** - `EducationDetails` (a single object, **not** a list - only the latest degree is returned)

| Field | Type | Notes |
|---|---|---|
| `degree` | string | |
| `institution` | string | |
| `duration` | string | `"YYYY-YYYY"` |
| `dgpa` | number (float) | |

```json
{
  "degree": "Bachelor of Technology in Computer Science & Engineering",
  "institution": "Institute of Engineering & Management, Kolkata",
  "duration": "2015-2019",
  "dgpa": 8.53
}
```

---

### `GET /skills`

**Response `200`** - `Skills`

| Field | Type |
|---|---|
| `programming_languages` | string[] |
| `databases_and_datawarehouses` | string[] |
| `data_analysis` | string[] |
| `frameworks` | string[] |
| `cloud_platforms` | string[] |
| `orchestrator` | string[] |
| `others` | object - map of category name → string[] |

`others` is an open-ended map; current keys include `azure_resources`, `gcp_resources`, `devops`, `monitoring_and_logging`, `messaging_and_caching`, `collaboration_and_project_management`, `database_and_api_tools`, `ides_and_editors`, `ai_tools`, `web_technologies`. Iterate over it rather than hard-coding keys.

```json
{
  "programming_languages": ["Python", "SQL", "Java", "JavaScript", "TypeScript"],
  "databases_and_datawarehouses": ["Microsoft SQL Server", "Oracle", "PostgreSQL", "Snowflake", "Databricks", "BigQuery"],
  "data_analysis": ["Pandas", "NumPy", "PySpark"],
  "frameworks": ["FastAPI", "Django", "Spring Boot", "RESTful APIs"],
  "cloud_platforms": ["Azure", "GCP"],
  "orchestrator": ["Apache Airflow"],
  "others": {
    "azure_resources": ["Azure Event Hubs", "Azure Blob Storage", "..."],
    "gcp_resources": ["Cloud Tasks", "Cloud Run", "BigQuery", "..."],
    "devops": ["Docker", "Kubernetes", "Jenkins", "Git", "..."],
    "monitoring_and_logging": ["Datadog", "Elasticsearch", "Kibana"],
    "web_technologies": ["HTML", "CSS", "Bootstrap", "Angular", "React"]
  }
}
```

---

### `GET /experience`

**Response `200`** - array of `Experience` objects (top level is a bare JSON array, not wrapped)

| Field | Type | Notes |
|---|---|---|
| `role` | string | |
| `company` | string | |
| `location` | string | |
| `duration` | string | Free text, e.g. `"December 2024 - Present"` |
| `clients_or_customers` | string | |
| `responsibilities` | string[] | |

```json
[
  {
    "role": "Senior Software Engineer",
    "company": "Impact Analytics",
    "location": "Bangalore, Karnataka, India",
    "duration": "December 2024 - Present",
    "clients_or_customers": "Different Retail & FMCG Companies - Notable Name: Bealls, Ralph Lauren, ...",
    "responsibilities": [
      "Designed, developed, tested, and integrated core data engineering pipelines ...",
      "..."
    ]
  }
]
```

---

### `GET /awards_recognitions`

**Response `200`** - array of `AwardsRecognitions` objects (bare JSON array)

| Field | Type | Notes |
|---|---|---|
| `award` | string | |
| `organization` | string | |
| `timeline_period` | string **or** string[] | ⚠️ Polymorphic: a single award date is a string, repeated awards are an array. Always normalize on the frontend. |

```json
[
  {
    "award": "Most Valuable Player of the Quarter",
    "organization": "Cisco Systems - Infosys Limited",
    "timeline_period": "March 2020"
  },
  {
    "award": "Raving Reviews Awards",
    "organization": "Apisero Inc.",
    "timeline_period": ["October 2021", "December 2021", "March 2022"]
  }
]
```

---

### `GET /resume/view`

Serves the resume PDF with `Content-Disposition: inline` - the browser renders it in a tab instead of downloading. Returns `application/pdf`, not JSON.

Best used as a plain link rather than `fetch()`:

```html
<a href="{base}/resume/view" target="_blank" rel="noopener">View Resume</a>
```

**Response `200`** - binary PDF (`Content-Type: application/pdf`, `Content-Disposition: inline; filename="Arunangshu_Pramanik_CV.pdf"`)

---

### `GET /resume/download`

Identical file, but served with `Content-Disposition: attachment` - the browser saves it as `Arunangshu_Pramanik_CV.pdf`.

```html
<a href="{base}/resume/download" download>Download Resume</a>
```

**Response `200`** - binary PDF (`Content-Disposition: attachment; filename="Arunangshu_Pramanik_CV.pdf"`)

**Errors (both resume endpoints)**

- `404` - `{ "detail": { "error_message": "...", "error_type": "ResumeUnavailable" } }` when the PDF isn't on the server. For `fetch()`-based callers, check `res.headers.get("content-type")` before reading the body as `blob()` vs `json()`.

### `GET /resume/print`

Print-friendly HTML resume rendered from the same `information/*.json` data as the site - no separate copy to maintain. Includes a Print/Save-as-PDF button that hides in `@media print`. Counted server-side as `resume_print`.

**Response `200`** - `text/html`. **Errors:** `404` with `ResumeUnavailable` when personal info can't be loaded.

---

### `GET /github_activity` and `GET /leetcode_stats`

Public coding-activity cards. Both proxy upstream APIs (`api.github.com`, `leetcode.com/graphql`), cache responses for `SOCIAL_CACHE_SECONDS` (default 600), and return `Cache-Control: public, max-age=300`. Usernames come from `GITHUB_USERNAME` / `LEETCODE_USERNAME`.

`github_activity` returns `username`, `public_repos`, `followers`, `recent_events`, `recent_pushes`, `latest_activity`, `profile_url`. `leetcode_stats` returns `username`, `solved`, `easy`, `medium`, `hard`, `ranking`, `profile_url`.

**Errors:** `503` with `ActivityUnavailable` when the upstream call fails - the frontend hides the cards rather than showing stale or zeroed data.

---

### `GET /github_feed`

Recent public GitHub events rendered as a changelog feed ("Recently updated" card on the site). Proxies `api.github.com/users/{GITHUB_USERNAME}/events/public`, cached for `SOCIAL_CACHE_SECONDS` (default 600), returns `Cache-Control: public, max-age=300`. Duplicate action+repo pairs are collapsed to the most recent occurrence, and unknown event types are filtered out.

**Response `200`**

```json
{
  "username": "arunangshu01",
  "events": [
    {
      "type": "PushEvent",
      "action": "pushed to",
      "repo": "arunangshu01/flowbench",
      "repo_url": "https://github.com/arunangshu01/flowbench",
      "created_at": "2026-11-11T14:20:00Z",
      "detail": "to split-requirements"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `events[].type` | string | Raw GitHub event type (`PushEvent`, `PullRequestEvent`, `CreateEvent`, `ReleaseEvent`, ...) |
| `events[].action` | string | Human-readable verb phrase |
| `events[].detail` | string \| null | Optional context: branch + commit count for pushes, ref type for creates, tag for releases |
| `events[].created_at` | string | ISO 8601 timestamp from GitHub |

**Errors:** `503` with `ActivityUnavailable` when the upstream call fails - the card hides entirely on failure or an empty feed.

### `GET /github_wrapped`

Aggregates over the ~90 days of public events GitHub exposes: `total_events`, `active_days` (distinct UTC dates), `current_streak` (consecutive active days ending today/yesterday), `top_repos` (top 5 by event count), `event_types` (per-type counts). Cached `SOCIAL_CACHE_SECONDS`, `max-age=300`. `503` `ActivityUnavailable` on upstream failure.

### `GET /repo_health`

For each `github_url` in `projects.json` (max 8), returns `{repo, repo_url, stars, open_issues, language, pushed_at}` from `api.github.com/repos`. Cached `SOCIAL_CACHE_SECONDS`, `max-age=300`. `503` when no repo data is fetchable; the frontend hides the chips row.

### `GET /notes` and `GET /notes/{note_id}`

Markdown notes in `backend/information/notes/`, named `YYYY-MM-DD-slug.md`. The first `# ` heading is the title; the first non-heading line is the excerpt. `GET /notes` returns `{notes: [{id, title, date, excerpt}]}` newest-first (`max-age=60`); `GET /notes/{id}` adds the raw `markdown` body (`max-age=300`). IDs must match `[a-z0-9-]+`; unknown or malformed IDs return `404` `NoteNotFound`. The frontend renders markdown with its own minimal renderer (headings, lists, code, links) after HTML-escaping.

### `GET /guestbook` and `POST /guestbook`

`GET /guestbook?limit=N` (≤ `GUESTBOOK_MAX_ENTRIES`, default 50) returns `{entries: [{name, message, created_at}]}` newest-first, `max-age=60`.

`POST /guestbook` takes JSON `{name (1-60), message (1-280)}` and returns `201`. Rate-limited to 3 posts/hour/IP and 20/hour globally (`GUESTBOOK_RATE_LIMIT_*`), `429` with `Retry-After: 60` beyond that. Storage is Firestore when `GUESTBOOK_BACKEND=firestore` (collection `guestbook`), otherwise a bounded in-memory deque. Entries render as escaped text; no HTML, markdown, or links are interpreted.

### `GET /analytics/trends`

Public-safe aggregates from the BigQuery sink: `{days, daily, top_events, total_events}` - daily event counts and top event names only, no client IPs or metadata. Cached 5 minutes server-side and `max-age=300`. `503` when `ANALYTICS_SINK` isn't `bigquery`; rate-limited like `/analytics/dashboard`. Queries still honor `maximum_bytes_billed`.

---

### `GET /status` and `PUT /status`

The footer "now" badge. `GET /status` is public and returns `Cache-Control: public, max-age=60`; content comes from `backend/information/now_status.json` through the shared mtime-based JSON cache.

**Response `200`** - `NowStatus`

| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | string | yes | One of `building`, `reading`, `learning`, `exploring`, `listening` |
| `label` | string | yes | 1-120 chars; shown after the kind label |
| `url` | string \| null | no | ≤256 chars; badge becomes a link when set |
| `updated_at` | string \| null | no | Set automatically by `PUT /status` |

```json
{
  "kind": "building",
  "label": "Flowbench - data pipeline playground",
  "url": "https://github.com/arunangshu01/flowbench",
  "updated_at": "2026-11-15"
}
```

`PUT /status` accepts the same JSON shape (**without** `updated_at` - it is overwritten with the current UTC date) and rewrites `now_status.json`, so changes take effect without a redeploy. **Protected** - requires `X-Admin-Token`. Errors: `401` missing/wrong token, `503` when `ANALYTICS_ADMIN_TOKEN` isn't configured, `422` for invalid kinds/oversized fields. `PUT` is not in the CORS allowlist; call it from curl or a server, not the browser.

---

### `GET /share/{project_id}`

Per-project share page. Social crawlers read Open Graph/Twitter tags - `og:title`, `og:description`, and the project's own screenshot as `og:image` - while humans get a meta-refresh + JS redirect to `{SITE_URL}/#projects`. Unknown IDs return `404`.

**Response `200`** - `text/html` with OG/Twitter meta tags.

---

### `GET /ask/status` and `POST /ask`

The ask-my-resume assistant. `GET /ask/status` returns `{ "enabled": bool }` - `true` only when `GROQ_API_KEY` or `GEMINI_API_KEY` is set, so the frontend can hide the widget on deployments without a key.

`POST /ask` takes `{ "question": "..." }` (3-500 chars) and returns `{ "answer": "..." }`. The system prompt grounds answers in the portfolio's `information/*.json` files, caps replies at ~120 words, and refuses unrelated questions. Groq is tried first, Gemini is the fallback; identical questions are cached for an hour.

**Rate limit:** 5 questions/hour per client IP and 60/hour globally (`ASK_RATE_LIMIT_*` env vars). Successful answers count as `ask_question` events.

**Errors:** `503` `NotConfigured` when no provider key is set, `429` `RateLimitExceeded`, `503` `AssistantUnavailable` when both providers fail.

---

### `POST /send_email`

Sends a contact-form email through the Brevo transactional email API. The request waits for Brevo to accept the email, so a `201` means it was handed off successfully and a `500` means it was not.

**Rate limit:** 3 requests/hour per client IP and 20/hour across all clients (configured via `EMAIL_RATE_LIMIT_MAX_REQUESTS` / `EMAIL_RATE_LIMIT_WINDOW_SECONDS` / `EMAIL_RATE_LIMIT_GLOBAL_MAX_REQUESTS` env vars). The client IP comes from the `X-Forwarded-For` entry selected by `CLIENT_IP_PROXY_HOPS`, never the client-written leftmost entry. The check happens *before* the email is sent, so a rejected request consumes no Brevo quota. Note the limiter is in-memory - it resets on app restart/redeploy and is not shared across multiple instances.

**Request** - `multipart/form-data` or `application/x-www-form-urlencoded` (NOT JSON)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Sender's name; 1-100 chars after trimming, single line |
| `email` | string | yes | Must be a valid email (≤254 chars); becomes the reply-to |
| `message` | string | yes | Message body; 1-5000 chars after trimming |

**Response `201`** - `SendMessageSuccess`

```json
{
  "message": "Your message has been sent successfully."
}
```

**Errors**

- `422` - missing/invalid form fields (FastAPI validation shape, see below)
- `429` - `{ "detail": { "error_message": "...", "error_type": "RateLimitExceeded" } }` when the client IP has exceeded the rate limit. The frontend should surface "please try again later" and **not** retry immediately.
- `500` - `{ "detail": { "error_message": "...", "error_type": "EmailDeliveryFailed" } }` when the email could not be sent (e.g. Brevo rejected the request); the underlying error is logged, not returned

Successful submissions are counted in analytics under the `contact_submit` event automatically - the frontend does not need to track this itself.

---

### `GET /projects`

Returns an array of projects in the order maintained in `backend/information/projects.json`. Fields: `id`, `name`, nullable `duration` (≤60 chars), `description`, nullable `case_study`, `technologies`, nullable `live_url`/`github_url`, `highlights`, `status` (`live`, `in_progress`, `archived`), `featured`, `current` (drives the hero "now" strip; at most one project should set it), nullable `image`, and `preview_enabled` (default `false`). IDs must be unique slugs; links must be HTTP(S), and images must be root-relative public asset paths. An empty array is valid; malformed project data returns a safe `422` response.

The frontend shows a static screenshot by default. For trusted external HTTPS projects with `preview_enabled: true`, visitors may explicitly load a sandboxed iframe. No URL scraping or screenshot generation occurs on API requests. Voice input and sign-in may require opening the full project. New iframe requests contact the project host only after visitors choose to load it.

### `POST /analytics/track`

Records a frontend event (page view, button click, section visit, etc.) in the in-memory tracker. Unlike `/send_email`, this endpoint takes a **JSON body**.

**Request** - `application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | string | yes | One of `page_view`, `section_view`, `cta_click`, `social_click`, `theme_toggle`, `palette_open`, `palette_command`, `music_play`, `project_click`, `project_preview`, `project_case_study`, `github_click`, `linkedin_click`, `leetcode_click`, `email_click`, `share_click`, `ask_open` |
| `page` | string (≤256 chars) | no | Frontend route/path the event came from |
| `metadata` | object | no | ≤8 keys matching `[a-z_]{1,32}`; values are scalars (strings ≤256 chars). `project` must be a published project ID to count toward public project engagement |

Unknown fields are rejected.

**Response `201`**

```json
{ "message": "Event tracked." }
```

**Errors**

- `422` - missing/invalid fields, unknown event names, or oversized metadata
- `429` - rate limited (default **30 requests/minute** per IP and 600/minute across all clients; `ANALYTICS_RATE_LIMIT_*` env vars)

**Server-side events** are tracked automatically with no frontend call needed: `resume_view`, `resume_download`, `contact_submit`. They count toward the public dashboard and are rejected if sent to this endpoint.

### `GET /analytics/dashboard`

Public aggregates for the Stats section: `total_views`, `viewing_now`, `daily_views` (last 14 days), `events` (allowlisted names only) and `projects` (published IDs only, with `clicks`, `previews`, `case_studies`). The Firestore snapshot is cached for 30 seconds. Errors: `429` above 30 requests/minute per IP or 600/minute overall (`Retry-After: 60`), `503` when storage is unavailable.

---

### `GET /analytics/summary`

Returns aggregated analytics. **Protected** - requires the `X-Admin-Token` header matching the `ANALYTICS_ADMIN_TOKEN` env var. This endpoint is for you, not the public frontend.

| Query param | Type | Default | Notes |
|---|---|---|---|
| `recent` | int | 20 | Number of recent events to include (max 500) |

**Response `200`**

```json
{
  "since": 1729500000.0,
  "total_events": 42,
  "counts": { "page_view": 30, "resume_view": 7, "contact_submit": 3, "resume_download": 2 },
  "recent_events": [
    { "event": "page_view", "page": "/experience", "client": "203.0.113.7", "metadata": {}, "timestamp": 1729500000.0 }
  ]
}
```

**Errors**

- `401` - missing/wrong `X-Admin-Token`
- `503` - `ANALYTICS_ADMIN_TOKEN` not configured on the server (endpoint disabled)

⚠️ This private event summary is **in-memory only** and resets on every restart/redeploy. The public view counter below is separate and uses durable Firestore storage in production.

### `GET /analytics/warehouse`

Aggregated analytics from the BigQuery warehouse. **Protected** - requires `X-Admin-Token`. Only active when `ANALYTICS_SINK=bigquery`; otherwise `503` `NotConfigured`.

Events are buffered in memory and flushed to `BQ_ANALYTICS_DATASET.BQ_ANALYTICS_TABLE` (default `portfolio_analytics.events`, auto-created on first flush) via **batch load jobs, which are free** - streaming inserts are billed and deliberately unused. Flushes trigger every `BQ_FLUSH_SECONDS` (default 300), at `BQ_FLUSH_BATCH` buffered rows (default 50), and at shutdown; failed flushes re-buffer the rows. Expect several minutes of lag before events appear here.

| Query param | Type | Default | Notes |
|---|---|---|---|
| `days` | int | 14 | Aggregation window, 1-90 |

**Response `200`**

```json
{
  "table": "ap-portfolio-241026.portfolio_analytics.events",
  "days": 14,
  "totals": { "page_view": 120, "project_click": 9 },
  "daily": { "2026-11-14": 45, "2026-11-15": 84 },
  "total_events": 129
}
```

Every query sets `maximum_bytes_billed` (`BQ_MAX_BYTES_BILLED`, default 100 MB) so reads cannot exceed the BigQuery free tier. Table schema: `event`, `page`, `client`, `metadata` (JSON string), `timestamp`.

**Errors:** `401` missing/wrong token, `503` `NotConfigured` when the sink is disabled or no admin token exists, `503` `WarehouseUnavailable` when the query fails.

### `GET /analytics/views` and `POST /analytics/views`

Public endpoints; no admin token is needed or returned. GET reads aggregates without registering a view. POST accepts only the following JSON fields:

```json
{
  "view_id": "44afd753-43e4-4dd6-b1ec-6639c36d15cb",
  "session_id": "51cbd573-a477-4147-ac38-96e01f877080"
}
```

Both fields must be UUIDs; extra fields are rejected. Keep `view_id` stable for one page load and retries; create a new one on reload. Reuse `session_id` in the same browser-tab session. A visible page sends a heartbeat every 30 seconds; stop in hidden tabs.

Both return `200` with aggregate data only:

```json
{ "total_views": 1234, "viewing_now": 2 }
```

`total_views` counts page loads, not unique people. `viewing_now` estimates anonymous sessions seen in the last 90 seconds. Responses use `Cache-Control: no-store`; a 10-second backend Firestore aggregation cache limits read costs. Counts are approximate and can be inflated by bots; they are not an authentication, billing, or security signal.

Firestore atomically deduplicates view IDs and retains the total across restarts. Anonymous view/session documents store timestamps and UUIDs only and expire after 24 hours of inactivity via TTL; TTL cleanup can be delayed and is not used to determine activity. Very old deduplication IDs may count again after expiry. The private `/analytics/track` and `/analytics/summary` behavior is unchanged. Local development defaults to an independent memory store.

Errors: `422` for invalid IDs/extra fields, `429` for more than 10 presence POSTs/minute per IP (best-effort process-local limit, `Retry-After: 60`), and `503` when storage is unavailable. A storage failure never substitutes a false zero or silently switches to memory.

## Error responses

**Data/validation errors on GET endpoints** (`422`): the `detail` field contains a serialized `ErrorResponseModel` - note it is an **object**, not the usual FastAPI array:

```json
{
  "detail": {
    "error_message": "Skills information is currently unavailable.",
    "error_type": "DataUnavailable"
  }
}
```

The message is generic by design; the underlying exception (file paths, validation details) is written to server logs only.

**Request validation errors on POST /send_email** (`422`): standard FastAPI/Pydantic array:

```json
{
  "detail": [
    { "type": "missing", "loc": ["body", "email"], "msg": "Field required", "input": null },
    { "type": "value_error", "loc": ["body", "email"], "msg": "value is not a valid email address", "input": "not-an-email" }
  ]
}
```

Handle both shapes: check `Array.isArray(err.detail)` before iterating.

## TypeScript types

```ts
interface HealthCheck {
  status: string;   // "OK"
  code: number;     // 200
}

interface Location {
  city: string;
  state: string;
  country: string;
}

interface SocialMediaProfiles {
  linkedin: string;
  github: string;
  leetcode: string;
}

interface PersonalInformation {
  name: string;
  phone: string;
  location: Location;
  email: string;
  social_media_profiles: SocialMediaProfiles;
}

interface ProfileSummary {
  summary: string;
}

interface EducationDetails {
  degree: string;
  institution: string;
  duration: string;
  dgpa: number;
}

interface Skills {
  programming_languages: string[];
  databases_and_datawarehouses: string[];
  data_analysis: string[];
  frameworks: string[];
  cloud_platforms: string[];
  orchestrator: string[];
  others: Record<string, string[]>;
}

interface Experience {
  role: string;
  company: string;
  location: string;
  duration: string;
  clients_or_customers: string;
  responsibilities: string[];
}
// GET /experience returns Experience[]

interface Award {
  award: string;
  organization: string;
  timeline_period: string | string[];
}
// GET /awards_recognitions returns Award[]

interface SendMessageSuccess {
  message: string;
}

interface NowStatus {           // GET/PUT /status
  kind: "building" | "reading" | "learning" | "exploring" | "listening";
  label: string;                // 1-120 chars
  url?: string | null;
  updated_at?: string | null;   // set server-side on PUT
}

interface GitHubFeedEvent {     // GET /github_feed
  type: string;
  action: string;
  repo: string;
  repo_url: string;
  created_at: string;
  detail?: string | null;
}

interface WarehouseSummary {    // GET /analytics/warehouse
  table: string;
  days: number;
  totals: Record<string, number>;
  daily: Record<string, number>;
  total_events: number;
}

interface ApiErrorDetail {          // GET endpoints, 422/500
  error_message: string;
  error_type: string;
}
```

## Frontend snippets

```ts
const API_BASE = process.env.REACT_APP_API_BASE ??
  "http://localhost:8080/arunangshu_pramanik/portfolio/v1";

// GET - all data endpoints are the same shape of call
export async function getSkills(): Promise<Skills> {
  const res = await fetch(`${API_BASE}/skills`);
  if (!res.ok) throw new Error(`GET /skills failed: ${res.status}`);
  return res.json();
}

// POST /send_email - must be FormData, not JSON
export async function sendContactEmail(name: string, email: string, message: string) {
  const body = new FormData();
  body.append("name", name);
  body.append("email", email);
  body.append("message", message);
  const res = await fetch(`${API_BASE}/send_email`, { method: "POST", body });
  if (res.status === 429) throw new Error("rate_limited"); // show "try again later"
  if (!res.ok) throw new Error(`POST /send_email failed: ${res.status}`);
  return res.json() as Promise<SendMessageSuccess>;
}

// Resume - plain links are simplest (no fetch needed)
const resumeViewUrl = `${API_BASE}/resume/view`;         // opens in-browser
const resumeDownloadUrl = `${API_BASE}/resume/download`; // saves as PDF

// POST /analytics/track - JSON body (unlike /send_email)
export async function trackEvent(event: string, page?: string, metadata?: object) {
  await fetch(`${API_BASE}/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, page, metadata }),
  }); // fire-and-forget: don't block UX on this
}

// Normalize the polymorphic award field
const periods = (a: Award) => Array.isArray(a.timeline_period)
  ? a.timeline_period
  : [a.timeline_period];
```

## Versioning & ops notes

- The URL carries a `v1` segment; breaking changes would presumably ship under a new prefix.
- Data is cached in memory via `utility/json_cache.py` and **auto-reloaded when a JSON file's mtime changes** - content edits go live on the next request without a restart (but on Cloud Run, filesystem changes still require a redeploy since the files ship with the image).
- GET endpoints can return `422` (not `500`) when the underlying JSON data is missing or fails validation - the frontend should treat any non-2xx as "content unavailable" and render a fallback.
- Health-check `/health` for uptime monitors and Cloud Run cold-start warm-up.
