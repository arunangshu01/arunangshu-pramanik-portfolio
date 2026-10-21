import { motion } from "framer-motion";
import Section from "./Section";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// "October 2019 - July 2021" -> Date(2019, 9). Parsed manually because
// Safari's Date parser rejects "Month YYYY" strings.
export function parseStart(duration) {
  const [month, year] = (duration ?? "").split("-")[0].trim().toLowerCase().split(/\s+/);
  const m = MONTHS.indexOf(month);
  const y = Number(year);
  return m >= 0 && y ? new Date(y, m) : null;
}

export function yearsOfExperience(jobs, now = new Date()) {
  const starts = (jobs ?? []).map((j) => parseStart(j.duration)).filter(Boolean);
  if (!starts.length) return null;
  const earliest = Math.min(...starts.map((d) => d.getTime()));
  return Math.floor((now - earliest) / (365.25 * 24 * 3600 * 1000));
}

export const countSkills = (skills) => {
  if (!skills) return null;
  const { others = {}, ...named } = skills;
  return new Set([...Object.values(named), ...Object.values(others)].flat()).size;
};

export function aboutStats({ experience, awards, skills }) {
  const years = yearsOfExperience(experience);
  return [
    ["Years engineering", years != null ? `${years}+` : null],
    ["Companies", experience?.length ?? null],
    ["Awards", awards?.length ?? null],
    ["Technologies", countSkills(skills)],
  ];
}

export default function About({ info, experience, awards, skills, education }) {
  const stats = aboutStats({ experience, awards, skills });
  const current = experience?.[0];
  const spec = [
    ["Role", current && `${current.role} @ ${current.company}`],
    [
      "Base",
      info &&
        [info.location.city, info.location.state, info.location.country]
          .filter(Boolean)
          .join(", "),
    ],
    ["Education", education && `${education.degree}, ${education.institution}`],
  ].filter(([, v]) => v);

  return (
    <Section id="about" num="01" eyebrow="the engineer behind the suit" title="About">
      {() => (
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-10">
          <motion.figure
            className="glass-card mx-auto w-full max-w-[280px] overflow-hidden p-2"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <picture>
              <source
                srcSet="/about-300.webp 300w, /about.webp 540w"
                sizes="264px"
                type="image/webp"
              />
              <img
                src="/about.jpg"
                alt={`${info?.name ?? "Arunangshu Pramanik"} outdoors`}
                loading="lazy"
                decoding="async"
                width="540"
                height="720"
                className="aspect-[3/4] w-full rounded-xl object-cover"
              />
            </picture>
            <figcaption className="px-1 py-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-accent/70">
              off-duty · recharging the reactor
            </figcaption>
          </motion.figure>

          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map(([label, value], i) => (
                <motion.div
                  key={label}
                  className="glass-card p-4 sm:p-5"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <p className="font-display text-2xl font-black sm:text-4xl">
                    <span className="shimmer-text">{value ?? "--"}</span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-400 sm:text-xs">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>

            {spec.length > 0 && (
              <dl className="glass-card divide-y divide-edge/60 px-5 py-2">
                {spec.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
                    <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-accent sm:w-24 sm:pt-0.5">
                      {k}
                    </dt>
                    <dd className="text-sm text-slate-300">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
