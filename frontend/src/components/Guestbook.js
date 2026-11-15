import { useEffect, useState } from "react";
import { getGuestbook, signGuestbook } from "../api";
import Section from "./Section";

const inputClass =
  "w-full rounded-lg border border-edge bg-ink/60 px-3 py-2.5 text-base text-slate-200 placeholder:text-slate-600 sm:py-2 sm:text-sm focus:border-accent/60 focus:outline-none";

export default function Guestbook() {
  const [entries, setEntries] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot; humans never see it
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    // Hide the section entirely if the guestbook can't be loaded.
    getGuestbook().then((data) => setEntries(data?.entries ?? [])).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const { entry } = await signGuestbook(name.trim(), message.trim(), website);
      // Show the new entry immediately; the list endpoint is CDN-cached.
      if (entry) setEntries((list) => [entry, ...(list ?? []).filter((e) => e.id !== entry.id)]);
      setName("");
      setMessage("");
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  if (entries === null) return null;

  return (
    <Section id="guestbook" num="09" eyebrow="say hi" title="Guestbook">
      {() => (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={submit} className="glass-card relative space-y-3 overflow-hidden p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Leave a note
          </p>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            maxLength={60}
            required
            aria-label="Your name"
          />
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message (280 chars max)"
            maxLength={280}
            required
            aria-label="Your message"
          />
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          />
          <p className="font-mono text-[10px] text-slate-600">No links, please - entries are public.</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-slate-600">
              {message.length}/280
            </p>
            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-11 rounded-lg border border-accent/60 px-5 py-2 font-mono sm:min-h-0 text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              {status === "sending" ? "Signing…" : "Sign"}
            </button>
          </div>
          {status === "done" && (
            <p className="font-mono text-xs text-emerald-400">Signed - thanks for stopping by.</p>
          )}
          {status === "error" && (
            <p className="font-mono text-xs text-red-400">{error}</p>
          )}
        </form>

        <div className="glass-card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Recent entries{entries.length > 0 && ` · ${entries.length}`}
          </p>
          {entries.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-slate-500">
              {"// be the first to sign"}
            </p>
          ) : (
            <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
              {entries.map((entry, i) => (
                <li key={entry.id ?? i}>
                  <p className="text-sm leading-relaxed text-slate-200 [overflow-wrap:anywhere]">"{entry.message}"</p>
                  <p className="mt-1 font-mono text-xs text-slate-500 [overflow-wrap:anywhere]">
                    - {entry.name}
                    <span className="text-slate-600"> · {entry.created_at?.slice(0, 10)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      )}
    </Section>
  );
}
