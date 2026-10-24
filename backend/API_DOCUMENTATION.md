# API Documentation - Portfolio Backend

REST API for the portfolio frontend. Built with FastAPI; serves resume/portfolio data from static JSON files and dispatches contact-form emails.

## Base URL

| Environment | Base URL |
|---|---|
| Local | `http://localhost:8080/arunangshu_pramanik/portfolio/v1` |
| Production (Render) | `https://arunangshu-pramanik-portfolio.onrender.com/arunangshu_pramanik/portfolio/v1` |

All endpoints below are relative to the base URL.

## Interactive docs

- **Swagger UI:** `{base}/docs`
- **ReDoc:** `{base}/redoc`
- **OpenAPI schema:** `{host}/openapi.json` - note this lives at the server root, **not** under the `/arunangshu_pramanik/portfolio/v1` prefix.

## Conventions

- **Auth:** none. All endpoints are public.
- **GET endpoints** return `application/json` with no request body, no query params - **except** the two resume endpoints, which return `application/pdf`.
- **POST /send_email** consumes `multipart/form-data` (or `application/x-www-form-urlencoded`), **not** `application/json`. From the browser, use `FormData` - a JSON body returns `422`.
- **POST /send_email** is rate-limited per client IP (default **3 requests/hour**); exceeding it returns `429`.
- **Errors** are JSON (see [Error responses](#error-responses)).

### CORS - important for frontend setup

`CORSMiddleware` is configured with `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`, and `allow_origins` populated from the **`CORS_ORIGINS` env var** (comma-separated; defaults to `http://localhost:3000`).

The frontend origin **must be listed in `CORS_ORIGINS`** or browser requests are blocked. For production on Render, set e.g. `CORS_ORIGINS=https://arunangshu-portfolio.vercel.app` (add the localhost origin too if needed for dev). Note `*` is not usable here because `allow_credentials=True` forbids it.

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
| GET | `/resume/view` | Resume PDF, opens inline in browser |
| GET | `/resume/download` | Resume PDF, downloads as attachment |
| POST | `/send_email` | Contact form → email (multipart form, rate-limited) |
| POST | `/analytics/track` | Record a frontend event (JSON body, rate-limited) |
| GET | `/analytics/summary` | Aggregated event counts (admin token required) |
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

- `404` - `{ "detail": { "error_message": "...", "error_type": "FileNotFoundError" } }` when the PDF isn't on the server. For `fetch()`-based callers, check `res.headers.get("content-type")` before reading the body as `blob()` vs `json()`.

---

### `POST /send_email`

Sends a contact-form email through the Brevo transactional email API. The request waits for Brevo to accept the email, so a `201` means it was handed off successfully and a `500` means it was not.

**Rate limit:** 3 requests/hour per client IP (configured via `EMAIL_RATE_LIMIT_MAX_REQUESTS` / `EMAIL_RATE_LIMIT_WINDOW_SECONDS` env vars). The check happens *before* the email is sent, so a rejected request consumes no Brevo quota. Note the limiter is in-memory - it resets on app restart/redeploy and is not shared across multiple instances.

**Request** - `multipart/form-data` or `application/x-www-form-urlencoded` (NOT JSON)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Sender's name |
| `email` | string | yes | Must be a valid email; becomes the reply-to |
| `message` | string | yes | Message body |

**Response `201`** - `SendMessageSuccess`

```json
{
  "message": "Your message has been sent successfully."
}
```

**Errors**

- `422` - missing/invalid form fields (FastAPI validation shape, see below)
- `429` - `{ "detail": { "error_message": "...", "error_type": "RateLimitExceeded" } }` when the client IP has exceeded the rate limit. The frontend should surface "please try again later" and **not** retry immediately.
- `500` - `{ "detail": { "error_message": "...", "error_type": "..." } }` when the email could not be sent (e.g. Brevo rejected the request)

Successful submissions are counted in analytics under the `contact_submit` event automatically - the frontend does not need to track this itself.

---

### `POST /analytics/track`

Records a frontend event (page view, button click, section visit, etc.) in the in-memory tracker. Unlike `/send_email`, this endpoint takes a **JSON body**.

**Request** - `application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | string (1-64 chars) | yes | e.g. `"page_view"`, `"section_view"`, `"project_click"` |
| `page` | string (≤256 chars) | no | Frontend route/path the event came from |
| `metadata` | object | no | Free-form extra data (keep it small) |

**Response `201`**

```json
{ "message": "Event tracked." }
```

**Errors**

- `422` - missing/invalid fields
- `429` - rate limited (default **30 requests/minute** per IP; `ANALYTICS_RATE_LIMIT_*` env vars)

**Server-side events** are tracked automatically with no frontend call needed: `resume_view`, `resume_download`, `contact_submit`.

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
    "error_message": "Error: ...",
    "error_type": "EmptyDataError"
  }
}
```

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
- Data is cached in memory via `utility/json_cache.py` and **auto-reloaded when a JSON file's mtime changes** - content edits go live on the next request without a restart (but on Render, filesystem changes still require a redeploy since the files ship with the repo).
- GET endpoints can return `422` (not `500`) when the underlying JSON data is missing or fails validation - the frontend should treat any non-2xx as "content unavailable" and render a fallback.
- Health-check `/health` for uptime monitors and render.com cold-start warm-up.
