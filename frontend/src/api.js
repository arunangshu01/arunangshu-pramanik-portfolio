// In dev, requests go through src/setupProxy.js (target from API_PROXY_TARGET),
// avoiding CORS. In prod set REACT_APP_API_BASE.
const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "/arunangshu_pramanik/portfolio/v1";

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const msg =
      detail && !Array.isArray(detail.detail) && detail.detail?.error_message
        ? detail.detail.error_message
        : `GET ${path} failed: ${res.status}`;
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const getPersonalInfo = () => get("/personal_info");
export const getProfileSummary = () => get("/profile_summary");
export const getEducationDetails = () => get("/education_details");
export const getSkills = () => get("/skills");
export const getExperience = () => get("/experience");
export const getAwards = () => get("/awards_recognitions");
export const getProjects = () => get("/projects");

async function viewRequest(options) {
  const res = await fetch(`${API_BASE}/analytics/views`, { cache: "no-store", ...options });
  if (!res.ok) {
    const error = new Error("View statistics unavailable");
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const getViewStats = (signal) => viewRequest({ signal });
export const updateViewPresence = (viewId, sessionId, signal) => viewRequest({
  method: "POST",
  signal,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ view_id: viewId, session_id: sessionId }),
});

// Resume endpoints return application/pdf and are used as plain links.
export const RESUME_VIEW_URL = `${API_BASE}/resume/view`;
export const RESUME_DOWNLOAD_URL = `${API_BASE}/resume/download`;

// POST /send_email consumes multipart/form-data, not JSON.
export async function sendContactEmail({ name, email, message }) {
  const body = new FormData();
  body.append("name", name);
  body.append("email", email);
  body.append("message", message);
  const res = await fetch(`${API_BASE}/send_email`, { method: "POST", body });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    let msg = `Failed to send message (${res.status})`;
    if (res.status === 429) {
      msg =
        detail?.detail?.error_message ??
        "Too many messages sent. Please try again later.";
    } else if (Array.isArray(detail?.detail)) {
      msg = detail.detail.map((d) => d.msg).join(", ");
    } else if (detail?.detail?.error_message) {
      msg = detail.detail.error_message;
    }
    throw new Error(msg);
  }
  return res.json();
}

// POST /analytics/track takes JSON (unlike /send_email). Fire-and-forget: never
// blocks or breaks the UI. Resume and contact events are tracked server-side.
// On in production builds and off in dev by default, so local work doesn't pollute
// the numbers. REACT_APP_ENABLE_ANALYTICS=true/false overrides either way.
export const ANALYTICS_ENABLED = process.env.REACT_APP_ENABLE_ANALYTICS
  ? process.env.REACT_APP_ENABLE_ANALYTICS === "true"
  : process.env.NODE_ENV === "production";
const trackedOnce = new Set();

export function trackEvent(event, metadata) {
  if (!ANALYTICS_ENABLED) return;
  fetch(`${API_BASE}/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      page: `${window.location.pathname}${window.location.hash}`.slice(0, 256),
      ...(metadata && { metadata }),
    }),
  }).catch(() => {});
}

// Deduped per page load - keeps section/page views well under the rate limit.
export function trackOnce(event, key, metadata) {
  const id = `${event}:${key}`;
  if (trackedOnce.has(id)) return;
  trackedOnce.add(id);
  trackEvent(event, metadata);
}

// timeline_period is polymorphic: string | string[]
export const awardPeriods = (a) =>
  Array.isArray(a.timeline_period) ? a.timeline_period : [a.timeline_period];
