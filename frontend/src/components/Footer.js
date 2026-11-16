import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { trackEvent } from "../api";
import ViewCounter from "./ViewCounter";
import NowPlaying from "./NowPlaying";

export default function Footer({ info }) {
  const email = info?.email;
  const github = info?.social_media_profiles?.github;
  const linkedin = info?.social_media_profiles?.linkedin;
  return (
    <footer className="border-t border-edge/60 px-4 pb-24 pt-10 text-center sm:pb-10">
      <div className="mx-auto flex max-w-md justify-center">
        <NowPlaying />
      </div>
      <ViewCounter />
      <img src="/mask.svg" alt="" className="mx-auto mt-3 h-8 w-8 opacity-70" />
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-1 gap-y-0 font-mono text-xs text-slate-600">
        <p className="mr-2">Created by {info?.name ?? "Arunangshu Pramanik"}</p>
        <a href="#api" className="flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-slate-500 transition-colors hover:text-accent">API</a>
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" aria-label="Arunangshu Pramanik on GitHub"
            onClick={() => trackEvent("github_click")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-accent">
            <FiGithub className="text-sm" aria-hidden="true" />
          </a>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="Arunangshu Pramanik on LinkedIn"
            onClick={() => trackEvent("linkedin_click")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-accent">
            <FiLinkedin className="text-sm" aria-hidden="true" />
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} aria-label="Email Arunangshu Pramanik"
            onClick={() => trackEvent("email_click")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-accent">
            <FiMail className="text-sm" aria-hidden="true" />
          </a>
        )}
      </div>
    </footer>
  );
}
