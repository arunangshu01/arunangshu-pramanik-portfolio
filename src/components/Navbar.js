import { useState } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";

const LINKS = [
  ["Skills", "#skills"],
  ["Experience", "#experience"],
  ["Education", "#education"],
  ["Awards", "#awards"],
  ["Contact", "#contact"],
];

export default function Navbar({ name, light, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-edge/60 bg-ink/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-[0_0_16px_rgba(245,184,61,0.55)] ring-2 ring-accent/50">
            <img src="/reactor.svg" alt="" className="h-8 w-8" />
          </span>
          <span className="hidden font-display text-sm font-bold uppercase tracking-widest sm:inline">
            {name ?? "Portfolio"}
          </span>
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="mr-2 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent/70 lg:flex">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            sys.online
          </span>
          <div className="hidden items-center gap-1 sm:gap-2 md:flex">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-2.5 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
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
            className={`ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-edge text-accent transition-colors hover:border-accent/60 ${
              light ? "" : "reactor-glow"
            }`}
          >
            {light ? (
              <img src="/mask.svg" alt="" className="h-5 w-5" />
            ) : (
              <img src="/reactor.svg" alt="" className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-slate-300 transition-colors hover:border-accent/60 hover:text-accent md:hidden"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-edge/60 bg-ink/95 px-6 py-3 backdrop-blur-xl md:hidden">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-slate-300 transition-colors hover:bg-white/5 hover:text-accent"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </motion.nav>
  );
}
