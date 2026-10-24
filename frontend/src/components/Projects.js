import { useState } from "react";
import { FiCode, FiExternalLink, FiGithub, FiPlay, FiX } from "react-icons/fi";
import Section from "./Section";
import { trackEvent } from "../api";

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function ProjectCard({ project }) {
  const [showDemo, setShowDemo] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const live = safeUrl(project.live_url);
  const github = safeUrl(project.github_url);
  const canEmbed = project.preview_enabled && live?.protocol === "https:" && live.origin !== window.location.origin;
  const hasImage = project.image?.startsWith("/") && !project.image.startsWith("//") && !project.image.includes("\\") && !imageFailed;
  const preview = (
    <div className="flex aspect-[16/10] items-center justify-center bg-ink/80">
      {hasImage ? (
        <img src={project.image} alt={`Screenshot of ${project.name}`} width="1440" height="900"
          className="h-full w-full object-contain" loading="lazy" onError={() => setImageFailed(true)} />
      ) : (
        <div className="text-center text-slate-400">
          <FiCode className="mx-auto mb-3 text-4xl text-accent" aria-hidden="true" />
          <p className="font-display text-lg">{project.name}</p>
          <p className="mt-2 font-mono text-xs">Project preview</p>
        </div>
      )}
    </div>
  );
  const click = (destination) => trackEvent("project_click", { project: project.id, destination });

  return (
    <article className="glass-card overflow-hidden">
      <div id={`preview-${project.id}`} className="border-b border-edge/60">
        <div className="flex items-center justify-between gap-3 bg-ink/50 px-4 py-3 font-mono text-xs text-slate-400">
          <span className="truncate">{live?.hostname || project.name}</span>
          <span className="shrink-0 text-accent">{project.status.replaceAll("_", " ")}</span>
        </div>
        {showDemo && canEmbed ? (
          <div>
            <iframe src={live.href} title={`Live preview of ${project.name}`}
              className="h-[32rem] w-full bg-ink" sandbox="allow-scripts allow-same-origin allow-forms"
              allow="microphone 'none'; camera 'none'; geolocation 'none'" referrerPolicy="no-referrer" />
            <p className="px-4 py-3 text-xs leading-relaxed text-slate-400">
              Embedded demo: sign-in, microphone access, or browser privacy settings may limit features.
              Open the live app for the full experience.
            </p>
          </div>
        ) : live ? (
          <a href={live.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.name} live app from screenshot`}
            onClick={() => click("preview_image")} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            {preview}
          </a>
        ) : preview}
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-bold text-white sm:text-2xl">{project.name}</h3>
          {project.featured && <span className="chip">Featured</span>}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{project.description}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${project.name} technologies`}>
          {project.technologies.map((technology) => <li key={technology} className="chip">{technology}</li>)}
        </ul>
        <ul className="mt-5 space-y-2 text-sm leading-relaxed text-slate-400">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />{highlight}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs">
          {live && <a href={live.href} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2"
            onClick={() => click("live")}><FiExternalLink aria-hidden="true" /> Open live app</a>}
          {github && <a href={github.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-edge px-5 py-3 transition-colors hover:border-accent hover:text-accent"
            onClick={() => click("github")}><FiGithub aria-hidden="true" /> Source code</a>}
          {canEmbed && <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-edge px-5 py-3 transition-colors hover:border-accent hover:text-accent" aria-expanded={showDemo}
            aria-controls={`preview-${project.id}`} onClick={() => {
              if (!showDemo) trackEvent("project_preview", { project: project.id });
              setShowDemo((value) => !value);
            }}>{showDemo ? <FiX aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
            {showDemo ? "Close live preview" : "Load live preview"}
          </button>}
        </div>
      </div>
    </article>
  );
}

export default function Projects({ state }) {
  return (
    <Section id="projects" num="03" eyebrow="what i've built" title="Projects" state={state}>
      {(projects) => projects.length ? (
        <div className="space-y-8">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
      ) : <p className="font-mono text-sm text-slate-400">More projects coming soon.</p>}
    </Section>
  );
}
