import { motion } from "framer-motion";
import Section from "./Section";
import { skillIcon } from "../skillIcons";

const LABELS = {
  databases_and_datawarehouses: "Databases and Data Warehouses",
  gcp_resources: "GCP Resources",
  devops: "DevOps",
  ides_and_editors: "IDEs and Editors",
  ai_tools: "AI Tools",
};

const toTitle = (key) =>
  LABELS[key] ??
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Skills({ state }) {
  return (
    <Section id="skills" num="02" eyebrow="what i work with" title="Skills" state={state}>
      {(skills) => {
        const { others = {}, ...named } = skills;
        const groups = { ...named, ...others };
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groups).map(([category, items], i) => (
              <motion.div
                key={category}
                className="glass-card p-5"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
              >
                <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
                  {toTitle(category)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(items || []).map((s) => {
                    const Icon = skillIcon(s);
                    return (
                      <span
                        key={s}
                        className="chip flex items-center gap-1.5 py-1.5"
                      >
                        <Icon className="text-sm text-amber-200" />
                        {s}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        );
      }}
    </Section>
  );
}
