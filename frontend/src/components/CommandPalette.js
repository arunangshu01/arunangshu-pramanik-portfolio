import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiDownload, FiExternalLink, FiFileText, FiMail, FiMoon, FiSearch, FiSun,
} from "react-icons/fi";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { RESUME_DOWNLOAD_URL, RESUME_VIEW_URL, trackEvent } from "../api";

const SECTIONS = ["About", "Skills", "Projects", "Experience", "Education", "Awards", "Contact", "Stats"];
const SOCIAL_ICONS = { github: SiGithub, linkedin: FaLinkedin, leetcode: SiLeetcode };
const SOCIAL_LABELS = { github: "GitHub", linkedin: "LinkedIn", leetcode: "LeetCode" };

export default function CommandPalette({ info, light, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      trackEvent("palette_open");
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const actions = useMemo(() => {
    const go = (hash) => () => { window.location.hash = hash; };
    const items = [
      ...SECTIONS.map((label) => ({
        id: `section-${label.toLowerCase()}`, group: "Navigate", label: `Go to ${label}`,
        keywords: label.toLowerCase(), run: go(`#${label.toLowerCase()}`),
      })),
      { id: "resume-view", group: "Actions", label: "View resume", icon: FiFileText,
        keywords: "resume view cv", run: () => window.open(RESUME_VIEW_URL, "_blank", "noopener") },
      { id: "resume-download", group: "Actions", label: "Download resume", icon: FiDownload,
        keywords: "resume download cv pdf", run: () => { window.location.href = RESUME_DOWNLOAD_URL; } },
      ...(info?.email ? [{ id: "copy-email", group: "Actions", label: "Copy email address", icon: FiMail,
        keywords: "email copy contact", run: () => navigator.clipboard?.writeText(info.email) }] : []),
      { id: "toggle-theme", group: "Actions", label: light ? "Switch to dark mode" : "Switch to light mode",
        icon: light ? FiMoon : FiSun, keywords: "theme dark light", run: onToggleTheme },
      ...Object.entries(info?.social_media_profiles ?? {}).map(([label, url]) => ({
        id: `social-${label}`, group: "Links",
        label: `Open ${SOCIAL_LABELS[label] ?? label.charAt(0).toUpperCase() + label.slice(1)}`,
        icon: SOCIAL_ICONS[label], keywords: `${label} profile social`,
        run: () => window.open(url, "_blank", "noopener"),
      })),
    ];
    return items;
  }, [info, light, onToggleTheme]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((action) =>
      action.label.toLowerCase().includes(term) || action.keywords.includes(term));
  }, [actions, query]);

  useEffect(() => { setIndex(0); }, [query]);

  const run = (action) => {
    trackEvent("palette_command", { command: action.id });
    setOpen(false);
    action.run();
  };

  const onInputKey = (event) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setIndex((i) => (i + 1) % filtered.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setIndex((i) => (i - 1 + filtered.length) % filtered.length); }
    else if (event.key === "Enter" && filtered[index]) { run(filtered[index]); }
  };

  useEffect(() => {
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette"
      onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="mx-auto mt-24 max-w-xl px-4">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-edge/60 px-4 py-3">
            <FiSearch className="shrink-0 text-slate-500" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKey}
              placeholder="Type a command or search…"
              aria-label="Command palette search"
              className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-slate-600"
            />
            <kbd className="shrink-0 rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-slate-500">esc</kbd>
          </div>
          <ul ref={listRef} role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center font-mono text-xs text-slate-500">No matching commands</li>
            )}
            {filtered.map((action, i) => {
              const Icon = action.icon ?? FiExternalLink;
              return (
                <li key={action.id} role="option" aria-selected={i === index}>
                  <button
                    type="button"
                    onClick={() => run(action)}
                    onMouseEnter={() => setIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      i === index ? "bg-accent/10 text-white" : "text-slate-300"
                    }`}
                  >
                    <Icon className="shrink-0 text-accent/70" aria-hidden="true" />
                    <span className="flex-1">{action.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">{action.group}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-edge/60 px-4 py-2 font-mono text-[10px] text-slate-600">
            ↑↓ navigate · ↵ run · esc close
          </div>
        </div>
      </div>
    </div>
  );
}
