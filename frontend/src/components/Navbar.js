import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiCode, FiCommand } from "react-icons/fi";
import { RESUME_LINK, SECTIONS } from "../sections";

// One navigation, identical on every device: every section in page order, then
// the resume. The API Playground also has a highlighted shortcut in the top bar.
const LINKS = [
  ...SECTIONS.map(({ id, label, short }) => [short ?? label, `#${id}`]),
  [RESUME_LINK.label, RESUME_LINK.href, true],
];
const SECTION_IDS = SECTIONS.map(({ id }) => id);

const linkProps = (external) =>
  external ? { target: "_blank", rel: "noopener noreferrer" } : {};

// Highlights the section currently in view (aria-current).
function useActiveSection() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        setActive([...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null);
      },
      // A section counts as "current" while it crosses the band below the sticky header.
      { rootMargin: "-150px 0px -50% 0px" }
    );
    // Sections can mount late (lazy-loaded, or after data arrives); re-scan briefly.
    const observed = new Set();
    const scan = () => {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && !observed.has(el)) {
          observer.observe(el);
          observed.add(el);
        }
      }
    };
    scan();
    const timer = setInterval(scan, 1500);
    const stop = setTimeout(() => clearInterval(timer), 15000);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);
  return active;
}

// Which edges of the link row have more links hidden (drives the fade hints).
function useScrollEdges(ref) {
  const [edges, setEdges] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, [ref]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [ref, update]);
  return edges;
}

export default function Navbar({ name, light, onToggleTheme }) {
  const active = useActiveSection();
  const rowRef = useRef(null);
  const edges = useScrollEdges(rowRef);
  const [first, ...rest] = (name ?? "Arunangshu Pramanik").split(" ");

  // Keep the active link in view when the row is scrollable.
  useEffect(() => {
    const row = rowRef.current;
    const link = active && row?.querySelector(`a[href="#${active}"]`);
    if (!row || !link || typeof row.scrollTo !== "function" || row.scrollWidth <= row.clientWidth) return;
    const left = link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  const isActive = (href) => href === `#${active}`;
  const iconButton =
    "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border px-2 font-mono text-xs transition-colors min-[360px]:px-2.5 sm:h-10";

  return (
    <motion.nav
      aria-label="Main"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-edge/60 bg-ink/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-2 py-2 max-[319px]:gap-1 max-[319px]:px-1.5 min-[360px]:gap-3 min-[360px]:px-3 sm:px-6 sm:py-3">
        <a
          href="#top"
          aria-label={`${name ?? "Portfolio"} - back to top`}
          className="flex min-h-11 min-w-0 items-center gap-1.5 max-[319px]:gap-1 min-[360px]:gap-2 sm:gap-3"
        >
          <span className="relative flex h-9 w-9 shrink-0 max-[319px]:h-8 max-[319px]:w-8 items-center justify-center rounded-full shadow-[0_0_16px_rgba(245,184,61,0.55)] ring-2 ring-accent/50 sm:h-10 sm:w-10">
            <img src="/reactor.svg" alt="" className="h-7 w-7 max-[319px]:h-6 max-[319px]:w-6 sm:h-8 sm:w-8" />
          </span>
          {/* Always shown: stacks onto two lines on small phones, one line from sm. */}
          <span className="flex min-w-0 flex-col font-display text-[10px] font-bold uppercase leading-tight tracking-wide max-[319px]:text-[9px] max-[319px]:tracking-normal min-[360px]:text-[11px] min-[400px]:text-xs min-[400px]:tracking-wider sm:flex-row sm:gap-[0.45em] sm:text-sm">
            <span className="truncate">{first}</span>
            {rest.length > 0 && <span className="truncate">{rest.join(" ")}</span>}
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-1 min-[360px]:gap-1.5 sm:gap-2">
          <a
            href="#api"
            aria-label="API Playground"
            aria-current={isActive("#api") ? "location" : undefined}
            title="API Playground - try the live backend"
            className={`${iconButton} border-accent/50 bg-accent/10 uppercase tracking-wider text-accent hover:bg-accent/20`}
          >
            <FiCode aria-hidden="true" />
            {/* Under 320px (folded Galaxy Fold) the name takes priority; the label stays for screen readers. */}
            <span className="max-[319px]:sr-only">API</span>
          </a>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-palette"))}
            aria-label="Open command palette"
            title="Command palette (Ctrl/⌘+K)"
            className={`${iconButton} border-edge text-slate-400 hover:border-accent/60 hover:text-accent`}
          >
            <FiCommand aria-hidden="true" />
            {/* Keyboard-shortcut hint: meaningless on touchscreens, so mouse/keyboard devices only. */}
            <span className="[@media(pointer:coarse)]:hidden">K</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
            title={light ? "Lights out" : "Day mode"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge text-accent transition-colors hover:border-accent/60 sm:h-10 sm:w-10 ${
              light ? "" : "reactor-glow"
            }`}
          >
            <img src={light ? "/mask.svg" : "/reactor.svg"} alt="" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Every section, on every device: centred when it fits, swipeable when it doesn't. */}
      <div className="relative border-t border-edge/40">
        <div
          ref={rowRef}
          data-testid="nav-links"
          className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto flex w-max snap-x gap-1 px-3 py-1 sm:px-6">
            {LINKS.map(([label, href, external]) => (
              <a
                key={label}
                href={href}
                {...linkProps(external)}
                aria-current={isActive(href) ? "location" : undefined}
                className={`inline-flex min-h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-lg px-3 font-mono text-xs uppercase tracking-wide transition-colors sm:min-h-10 ${
                  external ? "text-accent hover:bg-accent/10"
                    : isActive(href) ? "bg-accent/10 text-accent" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        {/* Fades only where more links are hidden. */}
        {edges.left && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ink to-transparent" />
        )}
        {edges.right && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ink to-transparent" />
        )}
      </div>
    </motion.nav>
  );
}
