import { useEffect, useState } from "react";
import { getGithubFeed } from "../api";

function timeAgo(iso) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function GitHubFeed() {
  const [feed, setFeed] = useState(null);
  const [owner, setOwner] = useState("");

  useEffect(() => {
    getGithubFeed()
      .then((data) => {
        setOwner(data?.username ?? "");
        setFeed(data?.events ?? []);
      })
      .catch(() => {});
  }, []);

  if (!feed?.length) return null;

  // Own repos read better without the "owner/" prefix, especially on phones.
  const repoName = (repo) => (owner && repo.startsWith(`${owner}/`) ? repo.slice(owner.length + 1) : repo);

  return (
    <div className="glass-card mt-3 p-3 sm:p-5" aria-label="Recent GitHub activity">
      <p className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Recently updated
      </p>
      <ul className="mt-2">
        {feed.map((item, i) => (
          <li key={`${item.repo}-${item.type}-${i}`}>
            <a
              href={item.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[44px] items-baseline gap-3 rounded-lg px-1 py-2 text-sm transition-colors hover:bg-white/5 sm:min-h-0 sm:py-1.5"
            >
              <span className="w-14 shrink-0 font-mono text-xs text-accent/80">
                {timeAgo(item.created_at)}
              </span>
              <span className="min-w-0 text-slate-300 [overflow-wrap:anywhere]">
                {item.action}{" "}
                <span className="font-medium text-slate-100 transition-colors group-hover:text-accent">
                  {repoName(item.repo)}
                </span>
                {item.detail && <span className="text-slate-500"> · {item.detail}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
