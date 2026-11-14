import { useEffect, useState } from "react";
import { SiGithub, SiLeetcode } from "react-icons/si";
import { getGithubActivity, getLeetcodeStats, trackEvent } from "../api";

function Card({ icon: Icon, title, url, event, children }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(event)}
      className="glass-card flex flex-1 items-center gap-4 p-5 transition-colors hover:border-accent/50"
    >
      <Icon className="shrink-0 text-2xl text-accent" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </a>
  );
}

export default function CodingActivity() {
  const [github, setGithub] = useState(null);
  const [leetcode, setLeetcode] = useState(null);

  useEffect(() => {
    getGithubActivity().then(setGithub).catch(() => {});
    getLeetcodeStats().then(setLeetcode).catch(() => {});
  }, []);

  if (!github && !leetcode) return null;

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Coding activity">
      {github && (
        <Card icon={SiGithub} title="On GitHub" url={github.profile_url} event="github_click">
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-white">{github.public_repos}</span> public repos
            {github.recent_pushes > 0 && (
              <> · <span className="font-semibold text-white">{github.recent_pushes}</span> pushes recently</>
            )}
          </p>
        </Card>
      )}
      {leetcode && (
        <Card icon={SiLeetcode} title="On LeetCode" url={leetcode.profile_url} event="leetcode_click">
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-white">{leetcode.solved}</span> solved
            <span className="text-slate-400"> · {leetcode.easy}E {leetcode.medium}M {leetcode.hard}H</span>
            {leetcode.ranking > 0 && (
              <> · rank <span className="font-semibold text-white">{leetcode.ranking.toLocaleString()}</span></>
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
