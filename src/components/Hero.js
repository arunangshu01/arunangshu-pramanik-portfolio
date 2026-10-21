import { motion } from "framer-motion";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { FiDownload, FiFileText } from "react-icons/fi";
import { RESUME_DOWNLOAD_URL, RESUME_VIEW_URL, trackEvent } from "../api";

const SOCIAL_ICONS = {
  linkedin: FaLinkedin,
  github: SiGithub,
  leetcode: SiLeetcode,
};

const SOCIAL_LABELS = {
  linkedin: "LinkedIn",
  github: "GitHub",
  leetcode: "LeetCode",
};

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: "easeOut" },
});

export default function Hero({ info, summary }) {
  const socials = info?.social_media_profiles;

  return (
    <header
      id="top"
      className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 md:flex-row md:items-start md:justify-between md:gap-12 lg:pt-28"
    >
      <div className="w-full min-w-0 max-w-2xl">
        <motion.p {...fadeUp(0)} className="mb-4 font-mono text-sm text-accent">
          [ System Online ] · Senior Software Engineer · Data & Cloud
        </motion.p>

        <motion.p
          {...fadeUp(0.05)}
          className="mb-3 font-mono text-sm text-slate-400"
        >
          <span className="text-accent">J.A.R.V.I.S.</span> - "Sir, allow me to
          introduce…"
        </motion.p>

        <motion.h1
          {...fadeUp(0.1)}
          className="break-words font-display text-[1.75rem] font-black uppercase leading-[1.15] tracking-wide min-[400px]:text-4xl sm:text-5xl lg:text-6xl"
        >
          {(() => {
            const [first, ...rest] = (info?.name ?? "Arunangshu Pramanik").split(" ");
            return (
              <>
                <span className="shimmer-text block pb-1">{first}</span>
                <span className="gradient-text-red block pb-2">
                  {rest.join(" ")}
                </span>
              </>
            );
          })()}
        </motion.h1>

        <motion.p
          {...fadeUp(0.18)}
          className="mt-4 text-lg font-semibold italic text-slate-300"
        >
          "I am <span className="shimmer-text font-bold">{info?.name ?? "Arunangshu Pramanik"}</span>."
        </motion.p>

        <motion.p
          {...fadeUp(0.25)}
          className="mt-2 font-mono text-sm italic text-slate-400"
        >
          <span className="text-accent2">S.T.A.R.K. protocol</span> - "Genius,
          engineer, data architect. The suit runs on pipelines."
        </motion.p>

        {summary && (
          <motion.p
            {...fadeUp(0)}
            className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            {summary}
          </motion.p>
        )}

        {info && (
          <motion.div
            {...fadeUp(0.1)}
            className="mt-6 font-mono text-sm text-slate-500"
          >
            {info.location.city}, {info.location.state} · {info.location.country}
          </motion.div>
        )}

        <motion.div
          {...fadeUp(0.55)}
          className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-edge/60 pt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600"
        >
          <span>unit // ap.mk-vii</span>
          <span className="text-accent/50">|</span>
          <span>class: senior engineer</span>
          <span className="text-accent/50">|</span>
          <span>status: deployed</span>
        </motion.div>

        <motion.div {...fadeUp(0.65)} className="mt-8 flex flex-wrap gap-3 sm:gap-4">
          <a
            href="#contact"
            onClick={() => trackEvent("cta_click", { cta: "get_in_touch" })}
            className="btn-primary text-center"
          >
            Get in touch
          </a>
          <a
            href={RESUME_VIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-6 py-3 font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <FiFileText className="text-lg" />
            View resume
          </a>
          <a
            href={RESUME_DOWNLOAD_URL}
            download
            aria-label="Download resume PDF"
            title="Download resume (PDF)"
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/50 px-4 py-3 text-accent transition-colors hover:bg-accent/10"
          >
            <FiDownload className="text-lg" />
            <span className="sm:hidden">Download</span>
          </a>
          {socials &&
            Object.entries(socials).map(([label, url]) => {
              const Icon = SOCIAL_ICONS[label];
              return (
                <a
                  key={label}
                  href={url}
                  onClick={() => trackEvent("social_click", { platform: label })}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-edge px-5 py-3 font-medium text-slate-300 transition-colors hover:border-accent/50 hover:text-accent sm:px-6"
                >
                  {Icon && <Icon className="text-lg" />}
                  {SOCIAL_LABELS[label] ??
                    label.charAt(0).toUpperCase() + label.slice(1)}
                </a>
              );
            })}
        </motion.div>
      </div>

      {/* portrait inside arc reactor ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="shrink-0"
      >
        <div className="relative h-44 w-44 min-[400px]:h-52 min-[400px]:w-52 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
          {/* outer rotating dashed ring */}
          <motion.div
            aria-hidden
            className="absolute -inset-5 rounded-full border-2 border-dashed border-accent/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          {/* inner counter-rotating segmented ring */}
          <motion.div
            aria-hidden
            className="absolute -inset-2 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "rgba(245,184,61,0.5)",
              borderRightColor: "rgba(224,52,43,0.5)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <picture>
            <source
              srcSet="/profile-256.webp 256w, /profile-512.webp 512w"
              sizes="(min-width: 1024px) 256px, (min-width: 640px) 224px, 208px"
              type="image/webp"
            />
            <img
              src="/profile-512.jpg"
              alt={info?.name ?? "Profile"}
              width="512"
              height="512"
              fetchpriority="high"
              className="reactor-glow h-full w-full rounded-full border-2 border-accent/50 object-cover"
            />
          </picture>
        </div>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-accent/60">
          arc reactor · mk vii
        </p>
      </motion.div>
    </header>
  );
}
