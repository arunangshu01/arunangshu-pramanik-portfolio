import { useEffect, useState } from "react";
import { getGuestbook, signGuestbook } from "../api";
import Section from "./Section";

const inputClass =
  "w-full rounded-lg border border-edge bg-ink/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-accent/60 focus:outline-none";

export default function Guestbook() {
  const [entries, setEntries] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  const refresh = () =>
    getGuestbook().then((data) => setEntries(data?.entries ?? [])).catch(() => setEntries([]));

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      await signGuestbook(name.trim(), message.trim());
      setName("");
      setMessage("");
      setStatus("done");
      refresh();
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
        <form onSubmit={submit} className="glass-card space-y-3 p-5">
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
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-slate-600">
              {message.length}/280
            </p>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg border border-accent/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              {status === "sending" ? "Signing…" : "Sign"}
            </button>
          </div>
          {status === "done" && (
            <p className="font-mono text-xs text-emerald-400">Signed — thanks for stopping by.</p>
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
                <li key={i}>
                  <p className="text-sm leading-relaxed text-slate-200">"{entry.message}"</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    — {entry.name}
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
