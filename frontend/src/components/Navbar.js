import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { RESUME_VIEW_URL } from "../api";

const LINKS = [
  ["About", "#about"],
  ["Skills", "#skills"],
  ["Projects", "#projects"],
  ["Experience", "#experience"],
  ["Education", "#education"],
  ["Awards", "#awards"],
  ["Contact", "#contact"],
  ["Resume", RESUME_VIEW_URL, true],
];

const linkProps = (external) =>
  external ? { target: "_blank", rel: "noopener noreferrer" } : {};

export default function Navbar({ name, light, onToggleTheme }) {
  const [open, setOpen] = useState(false);

  // Close the mobile menu when the viewport grows to desktop width.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = (e) => e.matches && setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-edge/60 bg-ink/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <a
          href="#top"
          aria-label={`${name ?? "Portfolio"} - back to top`}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_0_16px_rgba(245,184,61,0.55)] ring-2 ring-accent/50">
            <img src="/reactor.svg" alt="" className="h-8 w-8" />
          </span>
          <span className="hidden truncate font-display text-sm font-bold uppercase tracking-widest sm:inline">
            {name ?? "Portfolio"}
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([label, href, external]) => (
              <a
                key={label}
                href={href}
                {...linkProps(external)}
                className={`rounded-lg px-2.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-white/5 ${
                  external ? "text-accent hover:text-accent" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
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
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-slate-300 transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-edge/60 bg-ink/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden">
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
      )}
    </motion.nav>
  );
}
