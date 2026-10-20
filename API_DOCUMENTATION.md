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
- **GET endpoints** return `application/json` with no request body, no query params.
- **POST /send_email** consumes `multipart/form-data` (or `application/x-www-form-urlencoded`), **not** `application/json`. From the browser, use `FormData` - a JSON body returns `422`.
- **Errors** are JSON (see [Error responses](#error-responses)).

### CORS - important for frontend setup

`CORSMiddleware` is configured with `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]` - but **`allow_origins` is never set**, so the API sends no `Access-Control-Allow-Origin` header and browser cross-origin requests are blocked. Options:

1. Backend: add `allow_origins=["http://localhost:3000", "<prod-frontend-url>"]` in `app/main.py`.
2. Frontend dev: add `"proxy": "http://localhost:8080"` to `package.json` (CRA) and call same-origin paths.
3. Frontend prod: serve the frontend from the same origin, or put a reverse proxy in front.

Until one of these is done, `fetch()` from a different origin will fail in the browser even though `curl` works.

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
| POST | `/send_email` | Contact form → email (multipart form) |

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

### `POST /send_email`

Queues a contact-form email via SMTP (`BackgroundTasks`). Returns immediately; delivery happens in the background, so **a `201` does not guarantee the email was sent**.

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
- `500` - `{ "detail": { "error_message": "...", "error_type": "..." } }` on unexpected errors during request handling

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
  if (!res.ok) throw new Error(`POST /send_email failed: ${res.status}`);
  return res.json() as Promise<SendMessageSuccess>;
}

// Normalize the polymorphic award field
const periods = (a: Award) => Array.isArray(a.timeline_period)
  ? a.timeline_period
  : [a.timeline_period];
```

## Versioning & ops notes

- The URL carries a `v1` segment; breaking changes would presumably ship under a new prefix.
- Data is read from the `information/*.json` files into memory at startup, then re-validated per request - content edits require a redeploy/restart.
- GET endpoints can return `422` (not `500`) when the underlying JSON data is missing or fails validation - the frontend should treat any non-2xx as "content unavailable" and render a fallback.
- Health-check `/health` for uptime monitors and render.com cold-start warm-up.
