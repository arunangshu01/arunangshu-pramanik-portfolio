import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiCommand, FiMenu, FiX } from "react-icons/fi";
import { RESUME_VIEW_URL } from "../api";

const LINKS = [
  ["About", "#about"],
  ["Skills", "#skills"],
  ["Projects", "#projects"],
  ["Experience", "#experience"],
  ["Education", "#education"],
  ["Awards", "#awards"],
  ["Notes", "#notes"],
  ["Contact", "#contact"],
  ["Stats", "#stats"],
  ["Guestbook", "#guestbook"],
  ["API", "#api"],
  ["Resume", RESUME_VIEW_URL, true],
];

// The inline desktop row only has room for these; every section stays reachable
// from the menu button (shown at all sizes) and the command palette.
const SECONDARY = new Set(["Notes", "Guestbook", "API"]);
const DESKTOP_LINKS = LINKS.filter(([label]) => !SECONDARY.has(label));

const linkProps = (external) =>
  external ? { target: "_blank", rel: "noopener noreferrer" } : {};

export default function Navbar({ name, light, onToggleTheme }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-edge/60 bg-ink/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <a
          href="#top"
          aria-label={`${name ?? "Portfolio"} - back to top`}
          className="flex min-w-0 shrink-0 items-center gap-2.5"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_0_16px_rgba(245,184,61,0.55)] ring-2 ring-accent/50">
            <img src="/reactor.svg" alt="" className="h-8 w-8" />
          </span>
          <span className="hidden whitespace-nowrap font-display text-xs font-bold uppercase tracking-wider lg:inline xl:text-sm xl:tracking-widest">
            {name ?? "Portfolio"}
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center lg:flex">
            {DESKTOP_LINKS.map(([label, href, external]) => (
              <a
                key={label}
                href={href}
                {...linkProps(external)}
                className={`rounded-lg px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors hover:bg-white/5 xl:px-2.5 xl:text-xs xl:tracking-widest ${
                  external ? "text-accent hover:text-accent" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-palette"))}
            aria-label="Open command palette"
            title="Command palette (Ctrl/⌘+K)"
            className="ml-1 flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-edge px-2.5 font-mono text-xs text-slate-400 transition-colors hover:border-accent/60 hover:text-accent"
          >
            <FiCommand aria-hidden="true" /> <span className="hidden sm:inline">K</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
            title={light ? "Lights out" : "Day mode"}
            className={`ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-edge text-accent transition-colors hover:border-accent/60 ${
              light ? "" : "reactor-glow"
            }`}
          >
            <img src={light ? "/mask.svg" : "/reactor.svg"} alt="" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            aria-controls="site-menu"
            title="All sections"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-slate-300 transition-colors hover:border-accent/60 hover:text-accent"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      {open && (
        <div id="site-menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-edge/60 bg-ink/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {LINKS.map(([label, href, external]) => (
              <a
                key={label}
                href={href}
                {...linkProps(external)}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-3 font-mono text-sm uppercase tracking-widest transition-colors hover:bg-white/5 hover:text-accent ${
                  external ? "text-accent" : "text-slate-300"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.nav>
  );
}
