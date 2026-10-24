import { motion } from "framer-motion";
import { trackOnce } from "../api";

export default function Section({ id, num, eyebrow, title, state, children }) {
  return (
    <motion.section
      id={id}
      className="scroll-mt-20 py-12 sm:scroll-mt-24 sm:py-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      onViewportEnter={() => trackOnce("section_view", id, { section: id })}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {eyebrow && (
        <p className="mb-2 font-mono text-sm uppercase tracking-widest text-accent">
          <span className="mr-3 text-slate-600">{num} /</span>
          {eyebrow}
        </p>
      )}
      <h2 className="section-title mb-10">
        <span className="shimmer-text">{title}</span>
      </h2>
      {state?.loading && (
        <p className="animate-pulse font-mono text-sm text-slate-500" role="status">
          {state.slow ? (
            <>
              <span className="text-accent">J.A.R.V.I.S.</span> - "Bringing systems
              online, sir." First load can take up to a minute.
            </>
          ) : (
            "Loading…"
          )}
        </p>
      )}
      {state?.error && (
        <p className="font-mono text-sm text-slate-500">
          {"// content unavailable"}
        </p>
      )}
      {state ? state.data && children(state.data) : children()}
    </motion.section>
  );
}
