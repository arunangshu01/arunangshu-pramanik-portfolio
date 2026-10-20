// In dev, requests go through the CRA proxy (package.json "proxy") to the
// backend on :8080, avoiding CORS. In prod set REACT_APP_API_BASE.
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
    throw new Error(msg);
  }
  return res.json();
}

export const getPersonalInfo = () => get("/personal_info");
export const getProfileSummary = () => get("/profile_summary");
export const getEducationDetails = () => get("/education_details");
export const getSkills = () => get("/skills");
export const getExperience = () => get("/experience");
export const getAwards = () => get("/awards_recognitions");

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
    if (Array.isArray(detail?.detail)) {
      msg = detail.detail.map((d) => d.msg).join(", ");
    } else if (detail?.detail?.error_message) {
      msg = detail.detail.error_message;
    }
    throw new Error(msg);
  }
  return res.json();
}

// timeline_period is polymorphic: string | string[]
export const awardPeriods = (a) =>
  Array.isArray(a.timeline_period) ? a.timeline_period : [a.timeline_period];
