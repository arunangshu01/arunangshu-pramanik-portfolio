import { FiGithub, FiMail } from "react-icons/fi";
import ViewCounter from "./ViewCounter";

export default function Footer({ info }) {
  const email = info?.email;
  const github = info?.social_media_profiles?.github;
  return (
    <footer className="border-t border-edge/60 px-4 pb-24 pt-10 text-center sm:pb-10">
      {info && (
        <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 font-mono text-sm text-slate-400">
          <a href={`mailto:${info.email}`} className="hover:text-accent">{info.email}</a>
          <span aria-hidden>·</span>
          <a href={`tel:${info.phone.replace(/[^+\d]/g, "")}`} className="hover:text-accent">{info.phone}</a>
        </p>
      )}
      <ViewCounter />
      <img src="/mask.svg" alt="" className="mx-auto mt-3 h-8 w-8 opacity-70" />
      <div className="mt-2 flex items-center justify-center gap-3 font-mono text-xs text-slate-600">
        <p>Created by {info?.name ?? "Arunangshu Pramanik"}</p>
        {email && (
          <a href={`mailto:${email}`} aria-label="Email Arunangshu Pramanik"
            className="text-slate-500 transition-colors hover:text-accent">
            <FiMail className="text-sm" aria-hidden="true" />
          </a>
        )}
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" aria-label="Arunangshu Pramanik on GitHub"
            className="text-slate-500 transition-colors hover:text-accent">
            <FiGithub className="text-sm" aria-hidden="true" />
          </a>
        )}
      </div>
    </footer>
  );
}
