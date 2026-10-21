import { motion } from "framer-motion";
import Section from "./Section";

export default function Experience({ state }) {
  return (
    <Section id="experience" num="02" eyebrow="where i've been" title="Experience" state={state}>
      {(jobs) => (
        <div className="relative ml-2 border-l border-edge pl-6 sm:ml-6 sm:pl-8">
          {jobs.map((job, i) => (
            <motion.div
              key={i}
              className="relative mb-10 last:mb-0"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <span className="absolute -left-[33px] top-1.5 h-4 w-4 sm:-left-[41px] rounded-full border-2 border-accent bg-ink shadow-[0_0_12px_rgba(245,184,61,0.7)]" />
              <div className="glass-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white sm:text-xl">{job.role}</h3>
                    <p className="text-accent">{job.company}</p>
                    <p className="text-sm text-slate-500">{job.location}</p>
                  </div>
                  <span className="chip whitespace-nowrap">{job.duration}</span>
                </div>
                <p className="mt-3 text-sm italic text-slate-400">
                  {job.clients_or_customers}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-300">
                  {job.responsibilities.map((r, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}
