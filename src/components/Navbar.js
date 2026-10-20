import { motion } from "framer-motion";

const LINKS = [
  ["Skills", "#skills"],
  ["Experience", "#experience"],
  ["Education", "#education"],
  ["Awards", "#awards"],
  ["Contact", "#contact"],
];

export default function Navbar({ name }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("")
    : "AP";

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-edge/60 bg-ink/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 font-mono text-sm font-bold text-ink shadow-[0_0_16px_rgba(245,184,61,0.55)] ring-2 ring-accent/50">
            {initials}
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline">
            {name ?? "Portfolio"}
          </span>
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="mr-2 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent/70 md:flex">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            sys.online
          </span>
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
