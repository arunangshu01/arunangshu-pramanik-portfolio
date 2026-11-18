"use strict";

const path = require("node:path");
const fs = require("node:fs");

const DEFAULT_API =
  "https://arunangshupramanik.com/arunangshu_pramanik/portfolio/v1";
const SNAPSHOT = path.join(__dirname, "..", "data", "snapshot.json");
const ENDPOINTS = {
  info: "/personal_info",
  summary: "/profile_summary",
  experience: "/experience",
  skills: "/skills",
  projects: "/projects",
  education: "/education_details",
};

function loadSnapshot() {
  return JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
}

async function fetchJson(url, timeoutMs) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json", "User-Agent": "arunangshu-cli" },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

/**
 * Live data from the portfolio API, falling back per-section to the bundled
 * snapshot so the card always renders (offline, API cold start, outages).
 */
async function loadData({ offline = false, api = DEFAULT_API, timeoutMs = 4000 } = {}) {
  const snapshot = loadSnapshot();
  if (offline) return { data: snapshot, source: "snapshot" };
  const entries = await Promise.all(
    Object.entries(ENDPOINTS).map(async ([key, endpoint]) => {
      try {
        return [key, await fetchJson(`${api}${endpoint}`, timeoutMs), true];
      } catch {
        return [key, snapshot[key], false];
      }
    })
  );
  const live = entries.filter(([, , ok]) => ok).length;
  return {
    data: Object.fromEntries(entries.map(([key, value]) => [key, value])),
    source: live === entries.length ? "live" : live === 0 ? "snapshot" : "partial",
  };
}

module.exports = { loadData, loadSnapshot, ENDPOINTS, DEFAULT_API };
