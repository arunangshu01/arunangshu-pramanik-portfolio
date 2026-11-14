import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { trackEvent } from "../api";
import ViewCounter from "./ViewCounter";

export default function Footer({ info }) {
  const email = info?.email;
  const github = info?.social_media_profiles?.github;
  const linkedin = info?.social_media_profiles?.linkedin;
  return (
    <footer className="border-t border-edge/60 px-4 pb-24 pt-10 text-center sm:pb-10">
      <ViewCounter />
      <img src="/mask.svg" alt="" className="mx-auto mt-3 h-8 w-8 opacity-70" />
      <div className="mt-2 flex items-center justify-center gap-3 font-mono text-xs text-slate-600">
        <p>Created by {info?.name ?? "Arunangshu Pramanik"}</p>
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" aria-label="Arunangshu Pramanik on GitHub"
            onClick={() => trackEvent("github_click")}
            className="text-slate-500 transition-colors hover:text-accent">
            <FiGithub className="text-sm" aria-hidden="true" />
          </a>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="Arunangshu Pramanik on LinkedIn"
            onClick={() => trackEvent("linkedin_click")}
            className="text-slate-500 transition-colors hover:text-accent">
            <FiLinkedin className="text-sm" aria-hidden="true" />
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} aria-label="Email Arunangshu Pramanik"
            onClick={() => trackEvent("email_click")}
            className="text-slate-500 transition-colors hover:text-accent">
            <FiMail className="text-sm" aria-hidden="true" />
          </a>
        )}
      </div>
    </footer>
  );
}
