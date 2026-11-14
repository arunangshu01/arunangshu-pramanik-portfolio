import { useEffect, useRef, useState } from "react";
import { FiCpu, FiSend, FiX } from "react-icons/fi";
import { askQuestion, getAskStatus, trackEvent } from "../api";

const SUGGESTIONS = [
  "What does Arunangshu do?",
  "Has he worked with Airflow?",
  "What projects has he built?",
];

// Models ignore the "no markdown" instruction often enough that rendering a
// small subset is safer than showing raw asterisks.
function renderInline(text) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+|\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link || /^https?:\/\//.test(part)) {
      const href = link ? link[2] : part.replace(/[.,;!?)]+$/, "");
      const suffix = link ? "" : part.slice(href.length);
      const label = link ? link[1] : /^https?:\/\/github\.com(?:\/|$)/i.test(href) ? "GitHub repository" : "Visit website";
      return <span key={i}><a href={href} target="_blank" rel="noopener noreferrer" className="break-words text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">{label}</a>{suffix}</span>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-slate-700/60 px-1 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function MessageText({ text }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const list = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        const content = list ? list[1] : line;
        return (
          <p key={i} className={list ? "flex gap-1.5" : i > 0 ? "mt-1.5" : ""}>
            {list && <span aria-hidden="true" className="text-accent">•</span>}
            <span>{renderInline(content)}</span>
          </p>
        );
      })}
    </>
  );
}

export default function AskBot() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    getAskStatus()
      .then((status) => setEnabled(Boolean(status?.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (open) {
      trackEvent("ask_open");
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  if (!enabled) return null;

  const send = async (text) => {
    const question = text.trim();
    if (!question || busy) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const { answer } = await askQuestion(question);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        error: true,
        text: err.status === 429
          ? "That's a lot of questions - give me a breather and try again shortly."
          : "I'm offline at the moment. The contact form below still reaches him.",
      }]);
    } finally {
      setBusy(false);
    }
  };

  const latest = messages[messages.length - 1];
  const followUps = latest?.role === "assistant" && !latest.error
    ? [
        ...["Flowbench", "doppel", "M.A.H.A.K.A.L."].filter((name) =>
          latest.text.toLowerCase().includes(name.toLowerCase())
        ).map((name) => `Tell me more about ${name}`),
        "What is his experience at Impact Analytics?",
        "Which data engineering skills does he have?",
      ].filter((question) => !messages.some((message) => message.role === "user" && message.text === question)).slice(0, 2)
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Ask me anything about Arunangshu"}
        aria-expanded={open}
        className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-ink/90 text-lg text-accent shadow-lg backdrop-blur transition-colors hover:bg-accent/20 sm:bottom-6 sm:left-6 sm:h-12 sm:w-12"
      >
        {open ? <FiX aria-hidden="true" /> : <FiCpu aria-hidden="true" />}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Ask about Arunangshu"
          className="fixed bottom-16 left-4 z-50 flex max-h-[calc(100dvh-6rem)] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-edge bg-ink/95 shadow-2xl backdrop-blur sm:bottom-20 sm:left-6"
        >
          <div className="shrink-0 border-b border-edge/60 px-4 py-3">
            <p className="font-display text-sm font-semibold text-white">Ask J.A.R.V.I.S.</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              answers grounded in this portfolio
            </p>
          </div>
          <div ref={listRef} className="min-h-0 max-h-[min(32rem,55dvh)] overflow-y-auto overscroll-contain px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="block min-h-11 w-full rounded-lg border border-edge/60 px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={`mb-4 min-w-0 break-words rounded-xl px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "ml-auto max-w-[85%] bg-accent/15 text-white"
                    : "w-full bg-slate-800/60 text-slate-200"
                }`}
              >
                <MessageText text={message.text} />
              </div>
            ))}
            {!busy && followUps.length > 0 && (
              <div aria-label="Suggested follow-up questions" className="flex flex-wrap gap-2 pb-2">
                {followUps.map((question) => (
                  <button key={question} type="button" onClick={() => send(question)}
                    className="min-h-11 rounded-xl border border-edge px-3 py-2 text-left text-xs leading-relaxed text-slate-300 hover:border-accent/50 hover:text-accent">
                    {question}
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <div className="mb-2 inline-flex items-center gap-1 rounded-xl bg-slate-800/60 px-3 py-2 text-slate-400" aria-label="Assistant is thinking">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
              </div>
            )}
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-edge/60 px-3 py-2"
            onSubmit={(event) => { event.preventDefault(); send(input); }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              placeholder="Ask about his work…"
              aria-label="Question"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 sm:text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/50 text-accent transition-colors hover:bg-accent/15 disabled:opacity-40"
            >
              <FiSend aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
