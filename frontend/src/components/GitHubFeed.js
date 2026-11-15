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

  useEffect(() => {
    getGithubFeed().then((data) => setFeed(data?.events ?? [])).catch(() => {});
  }, []);

  if (!feed?.length) return null;

  return (
    <div className="glass-card mt-3 p-4 sm:p-5" aria-label="Recent GitHub activity">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Recently updated
      </p>
      <ul className="mt-3 space-y-2.5">
        {feed.map((item, i) => (
          <li key={i} className="flex items-baseline gap-2 text-sm">
            <span className="shrink-0 font-mono text-xs text-accent/80">
              {timeAgo(item.created_at)}
            </span>
            <span className="min-w-0 truncate text-slate-300">
              {item.action}{" "}
              <a
                href={item.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-100 transition-colors hover:text-accent"
              >
                {item.repo}
              </a>
              {item.detail && (
                <span className="text-slate-500"> · {item.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
