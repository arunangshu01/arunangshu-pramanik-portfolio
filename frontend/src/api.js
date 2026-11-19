// In dev, requests go through src/setupProxy.js (target from API_PROXY_TARGET),
// avoiding CORS. In prod set REACT_APP_API_BASE.
export const API_BASE =
  process.env.REACT_APP_API_BASE ??
  "/arunangshu_pramanik/portfolio/v1";

// Absolute API origin + prefix, for display (e.g. "copy as curl").
export const apiUrl = (path) =>
  new URL(`${API_BASE}${path}`, window.location.origin).toString();

// Raw GET for the API playground: resolves for any HTTP status so the caller
// can display error responses too. Rejects only on network failure/timeout.
export async function rawGet(path, signal) {
  const started = performance.now();
  const res = await fetch(`${API_BASE}${path}`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  return {
    status: res.status,
    ok: res.ok,
    ms: Math.round(performance.now() - started),
    contentType: res.headers.get("content-type") ?? "",
    bytes: new Blob([text]).size,
    text,
  };
}

// In-flight request counter so the boot screen can wait for the whole initial
// data burst (useApi hooks + component-level fetches), not just the hooks.
let pendingRequests = 0;
const pendingListeners = new Set();

export function subscribePendingRequests(listener) {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
}
export function getPendingRequestCount() {
  return pendingRequests;
}
function beginRequest() {
  pendingRequests += 1;
  pendingListeners.forEach((listener) => listener());
}
function endRequest() {
  pendingRequests -= 1;
  pendingListeners.forEach((listener) => listener());
}

async function get(path) {
  beginRequest();
  try {
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
  } finally {
    endRequest();
  }
}

export const getPersonalInfo = () => get("/personal_info");
export const getProfileSummary = () => get("/profile_summary");
export const getEducationDetails = () => get("/education_details");
export const getSkills = () => get("/skills");
export const getExperience = () => get("/experience");
export const getAwards = () => get("/awards_recognitions");
export const getProjects = () => get("/projects");
export const getGithubActivity = () => get("/github_activity");
export const getGithubFeed = () => get("/github_feed");
export const getNowStatus = () => get("/status");
export const getGithubWrapped = () => get("/github_wrapped");
export const getRepoHealth = () => get("/repo_health");
export const getAnalyticsTrends = () => get("/analytics/trends");
export const getNotes = () => get("/notes");
export const getNote = (id) => get(`/notes/${id}`);
export const getGuestbook = () => get("/guestbook");

export async function signGuestbook(name, message, website = "") {
  const res = await fetch(`${API_BASE}/guestbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, message, website }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const validation = Array.isArray(detail?.detail) ? detail.detail : [];
    const error = new Error(
      res.status === 429
        ? "Too many entries. Please try again later."
        : validation.some((d) => String(d.msg).includes("links"))
          ? "Links aren't allowed in guestbook entries."
          : validation.length
            ? "Please check your name and message."
            : detail?.detail?.error_message ?? "Could not sign the guestbook."
    );
    error.status = res.status;
    throw error;
  }
  return res.json();
}
export const getLeetcodeStats = () => get("/leetcode_stats");
export const getAskStatus = () => get("/ask/status");

// Share links carry per-project OG tags server-side; use the same-origin API path.
export const projectShareUrl = (projectId) =>
  `${window.location.origin}${API_BASE}/share/${projectId}`;

export async function askQuestion(question) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const error = new Error(
      detail?.detail?.error_message ??
        (res.status === 429
          ? "Too many questions. Please try again later."
          : "The assistant is temporarily unavailable.")
    );
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function viewRequest(options) {
  beginRequest();
  try {
    const res = await fetch(`${API_BASE}/analytics/views`, { cache: "no-store", ...options });
    if (!res.ok) {
      const error = new Error("View statistics unavailable");
      error.status = res.status;
      throw error;
    }
    return res.json();
  } finally {
    endRequest();
  }
}

export const getViewStats = (signal) => viewRequest({ signal });
export const getDashboard = () => get("/analytics/dashboard");
export const updateViewPresence = (viewId, sessionId, signal) => viewRequest({
  method: "POST",
  signal,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ view_id: viewId, session_id: sessionId }),
});

// Resume endpoints return application/pdf and are used as plain links.
export const RESUME_VIEW_URL = `${API_BASE}/resume/view`;
export const RESUME_DOWNLOAD_URL = `${API_BASE}/resume/download`;
export const RESUME_PRINT_URL = `${API_BASE}/resume/print`;

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
