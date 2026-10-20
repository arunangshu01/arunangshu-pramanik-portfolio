import { motion } from "framer-motion";
import Section from "./Section";
import { awardPeriods } from "../api";

export default function Awards({ state }) {
  return (
    <Section id="awards" num="04" eyebrow="recognition" title="Awards" state={state}>
      {(awards) => (
        <div className="grid gap-5 sm:grid-cols-2">
          {awards.map((a, i) => (
            <motion.div
              key={i}
              className="glass-card p-5"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl text-accent">✦</span>
                <div>
                  <h3 className="font-bold text-white">{a.award}</h3>
                  <p className="text-sm text-slate-400">{a.organization}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {awardPeriods(a).map((p) => (
                      <span key={p} className="chip">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}
