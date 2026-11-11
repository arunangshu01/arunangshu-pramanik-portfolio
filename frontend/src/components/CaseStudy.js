import { useRef } from "react";
import { createPortal } from "react-dom";
import { FiExternalLink, FiGithub, FiX } from "react-icons/fi";
import { useModal } from "../useModal";

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h4 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />{item}
        </li>
      ))}
    </ul>
  );
}

export default function CaseStudy({ project, live, github, onClose }) {
  const study = project.case_study;
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  useModal(dialogRef, onClose, { initialFocusRef: closeRef });

  // Portal to <body>: the card's backdrop-filter would otherwise become the
  // containing block for `fixed`, confining the overlay to the card.
  return createPortal(
    <div ref={dialogRef} className="fixed inset-0 z-[55] overflow-y-auto bg-ink/90 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label={`Case study: ${project.name}`}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="glass-card relative p-6 sm:p-10">
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close case study"
            className="absolute right-4 top-4 rounded-full border border-edge p-2 text-slate-400 transition-colors hover:border-accent hover:text-accent">
            <FiX aria-hidden="true" />
          </button>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Case study</p>
          <h3 className="mt-2 pr-10 font-display text-2xl font-bold text-white sm:text-3xl">{project.name}</h3>
          {project.duration && <p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-500">{project.duration}</p>}

          <Section title="The problem">
            <p className="text-sm leading-relaxed text-slate-300">{study.problem}</p>
          </Section>

          <Section title="Approach">
            <BulletList items={study.approach} />
          </Section>

          {study.decisions?.length > 0 && (
            <Section title="Key decisions">
              <ul className="space-y-4">
                {study.decisions.map((decision) => (
                  <li key={decision.title}>
                    <p className="font-display text-sm font-semibold text-white">{decision.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{decision.detail}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {study.challenges?.length > 0 && (
            <Section title="Challenges">
              <BulletList items={study.challenges} />
            </Section>
          )}

          {study.outcome && (
            <Section title="Outcome">
              <p className="text-sm leading-relaxed text-slate-300">{study.outcome}</p>
            </Section>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-edge/60 pt-6 font-mono text-xs">
            {live && <a href={live.href} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2"><FiExternalLink aria-hidden="true" /> Open live app</a>}
            {github && <a href={github.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-edge px-5 py-3 transition-colors hover:border-accent hover:text-accent"><FiGithub aria-hidden="true" /> Source code</a>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
