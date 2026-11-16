import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiCopy, FiPlay, FiTerminal } from "react-icons/fi";
import { apiUrl, rawGet, trackEvent } from "../api";
import { highlightJson } from "../jsonHighlight";
import Section from "./Section";

// Public, read-only endpoints only. Writes (guestbook, analytics, contact) and
// admin routes are deliberately excluded so the console can't be used to spam.
export const ENDPOINTS = [
  { group: "Profile", path: "/personal_info", desc: "Name, location, and social profiles" },
  { group: "Profile", path: "/profile_summary", desc: "Professional summary" },
  { group: "Profile", path: "/experience", desc: "Roles and responsibilities" },
  { group: "Profile", path: "/skills", desc: "Categorized skills" },
  { group: "Profile", path: "/projects", desc: "Project cards and preview settings" },
  { group: "Profile", path: "/education_details", desc: "Education" },
  { group: "Profile", path: "/awards_recognitions", desc: "Awards" },
  { group: "Activity", path: "/status", desc: "Current \"now\" badge" },
  { group: "Activity", path: "/github_activity", desc: "GitHub profile stats" },
  { group: "Activity", path: "/github_feed", desc: "Recent public GitHub events" },
  { group: "Activity", path: "/github_wrapped", desc: "90-day GitHub aggregates" },
  { group: "Activity", path: "/repo_health", desc: "Showcased repo health" },
  { group: "Activity", path: "/leetcode_stats", desc: "LeetCode solved counts" },
  { group: "Content", path: "/notes", desc: "Note cards" },
  { group: "Content", path: "/notes/{note_id}", desc: "One note's markdown", param: "note_id" },
  { group: "Content", path: "/guestbook", desc: "Recent guestbook entries" },
  { group: "Analytics", path: "/analytics/views", desc: "Total views and viewing now" },
  { group: "Analytics", path: "/analytics/dashboard", desc: "Public Stats aggregates" },
  { group: "Analytics", path: "/analytics/trends", desc: "BigQuery warehouse trends" },
  { group: "Meta", path: "/health", desc: "Liveness check" },
  { group: "Meta", path: "/ask/status", desc: "Is the assistant enabled?" },
];

const PARAM_PATTERN = /^[a-z0-9-]{1,80}$/;
const MIN_INTERVAL_MS = 750;
const MAX_RENDER_CHARS = 60000;

function statusClass(status) {
  if (status < 300) return "border-emerald-500/40 text-emerald-300";
  if (status < 500) return "border-amber-500/40 text-amber-300";
  return "border-red-500/40 text-red-300";
}

function formatBody(response) {
  if (!response) return "";
  if (response.contentType.includes("json")) {
    try {
      return JSON.stringify(JSON.parse(response.text), null, 2);
    } catch {
      return response.text;
    }
  }
  return response.text;
}

function useCopy() {
  const [copied, setCopied] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (key, text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };
  return [copied, copy];
}

function TerminalCard() {
  const [published, setPublished] = useState(false);
  const [copied, copy] = useCopy();

  // Only advertise the CLI once it actually exists on npm.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("https://registry.npmjs.org/arunangshu/latest", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setPublished(Boolean(res?.ok));
      } catch {
        // Registry unreachable: keep the card hidden.
      }
    })();
    return () => controller.abort();
  }, []);

  if (!published) return null;

  return (
    <div className="glass-card mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <FiTerminal className="shrink-0 text-xl text-accent" aria-hidden="true" />
        <div>
          <p className="text-sm text-slate-200">Prefer the terminal?</p>
          <p className="font-mono text-xs text-slate-500">The same data, as a resume card in your shell.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => copy("npx", "npx arunangshu")}
        className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-ink/60 px-3 py-2 font-mono text-sm text-accent transition-colors hover:border-accent/60"
        aria-label="Copy npx arunangshu"
      >
        <span><span className="text-slate-500">$</span> npx arunangshu</span>
        {copied === "npx" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      </button>
    </div>
  );
}

export default function ApiPlayground() {
  const [selected, setSelected] = useState(ENDPOINTS[0].path);
  const [param, setParam] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, copy] = useCopy();
  const lastSent = useRef(0);
  const controller = useRef(null);

  const endpoint = ENDPOINTS.find((e) => e.path === selected) ?? ENDPOINTS[0];
  const paramValid = !endpoint.param || PARAM_PATTERN.test(param);
  const path = endpoint.param
    ? endpoint.path.replace(`{${endpoint.param}}`, encodeURIComponent(param || `{${endpoint.param}}`))
    : endpoint.path;
  const groups = useMemo(
    () => [...new Set(ENDPOINTS.map((e) => e.group))].map((group) => ({
      group, items: ENDPOINTS.filter((e) => e.group === group),
    })),
    []
  );

  useEffect(() => () => controller.current?.abort(), []);

  const choose = (nextPath) => {
    setSelected(nextPath);
    setResponse(null);
    setError("");
  };

  const send = async () => {
    const now = Date.now();
    if (loading || !paramValid || now - lastSent.current < MIN_INTERVAL_MS) return;
    lastSent.current = now;
    controller.current?.abort();
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 15000);
    setLoading(true);
    setError("");
    trackEvent("api_try", { endpoint: endpoint.path });
    try {
      setResponse(await rawGet(path, controller.current.signal));
    } catch (err) {
      setResponse(null);
      setError(err.name === "AbortError" ? "Request timed out." : "Network error - the API could not be reached.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const body = formatBody(response);
  const truncated = body.length > MAX_RENDER_CHARS;
  const shown = truncated ? body.slice(0, MAX_RENDER_CHARS) : body;
  const isJson = response?.contentType.includes("json");

  return (
    <Section id="api">
      {() => (
        <>
          <p className="mb-6 max-w-2xl text-sm text-slate-400">
            This site runs on a FastAPI backend. Pick an endpoint and fire a real request - the
            same calls the page makes. Read-only, no auth needed.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            {/* Same endpoint list on every device: a sidebar on wide screens, a scrollable panel above the request otherwise. */}
            <nav aria-label="API endpoints" className="glass-card max-h-64 overflow-y-auto p-2 lg:max-h-[34rem]">
              {groups.map(({ group, items }) => (
                <div key={group} className="mb-2">
                  <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">{group}</p>
                  {items.map((e) => (
                    <button
                      key={e.path}
                      type="button"
                      onClick={() => choose(e.path)}
                      aria-current={e.path === selected ? "true" : undefined}
                      className={`block w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors [@media(pointer:coarse)]:py-3 ${
                        e.path === selected ? "bg-accent/10 text-accent" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {e.path}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="min-w-0 space-y-3">
              <div className="glass-card p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-edge bg-ink/60 px-3 py-2 font-mono text-sm">
                    <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">GET</span>
                    <span className="truncate text-slate-200" title={apiUrl(path)}>{path}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copy("curl", `curl -s ${apiUrl(path)}`)}
                      disabled={!paramValid}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-edge px-3 py-2 font-mono text-xs [@media(pointer:fine)]:min-h-0 text-slate-300 transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40 sm:flex-none"
                    >
                      {copied === "curl" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} curl
                    </button>
                    <button
                      type="button"
                      onClick={send}
                      disabled={loading || !paramValid}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono [@media(pointer:fine)]:min-h-0 text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 sm:flex-none"
                    >
                      <FiPlay aria-hidden="true" /> {loading ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
                {endpoint.param && (
                  <label className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="shrink-0 font-mono text-xs text-slate-500">{endpoint.param}</span>
                    <input
                      value={param}
                      onChange={(e) => setParam(e.target.value.toLowerCase().trim())}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder="e.g. why-i-built-a-bigquery-analytics-sink"
                      maxLength={80}
                      className="w-full rounded-lg border border-edge bg-ink/60 px-3 py-2.5 font-mono text-base text-slate-200 placeholder:text-slate-600 sm:py-2 sm:text-sm focus:border-accent/60 focus:outline-none"
                    />
                  </label>
                )}
                {endpoint.param && param && !paramValid && (
                  <p className="mt-2 font-mono text-xs text-red-400">Use lowercase letters, digits, and hyphens.</p>
                )}
                <p className="mt-3 text-xs text-slate-500">{endpoint.desc}</p>
              </div>

              <div className="glass-card min-w-0 overflow-hidden" aria-live="polite">
                <div className="flex flex-wrap items-center gap-2 border-b border-edge/60 px-4 py-2.5 font-mono text-xs">
                  <span className="text-slate-500">Response</span>
                  {response && (
                    <>
                      <span className={`rounded border px-1.5 py-0.5 ${statusClass(response.status)}`}>{response.status}</span>
                      <span className="text-slate-500">{response.ms} ms</span>
                      <span className="text-slate-500">{(response.bytes / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => copy("body", body)}
                        className="-my-2 -mr-2 ml-auto flex min-h-11 items-center gap-1 rounded-lg px-2 text-slate-400 transition-colors hover:text-accent [@media(pointer:fine)]:min-h-0 [@media(pointer:fine)]:py-1"
                      >
                        {copied === "body" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} copy
                      </button>
                    </>
                  )}
                </div>
                <pre className="max-h-[26rem] min-h-[10rem] overflow-auto whitespace-pre-wrap p-3 font-mono text-[11px] leading-relaxed text-slate-300 [overflow-wrap:anywhere] sm:whitespace-pre sm:p-4 sm:text-xs sm:[overflow-wrap:normal]">
                  {loading && <span className="animate-pulse text-slate-500">Sending request…</span>}
                  {!loading && error && <span className="text-red-400">{error}</span>}
                  {!loading && !error && !response && (
                    <span className="text-slate-600">{"// press Send to fire the request"}</span>
                  )}
                  {!loading && !error && response && (isJson ? highlightJson(shown) : shown)}
                  {!loading && truncated && (
                    <span className="block pt-2 text-slate-500">{"// … truncated for display - copy for the full body"}</span>
                  )}
                </pre>
              </div>
            </div>
          </div>
          <TerminalCard />
        </>
      )}
    </Section>
  );
}
