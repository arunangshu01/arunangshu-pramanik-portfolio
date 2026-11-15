import { useEffect, useState } from "react";
import { FiStar } from "react-icons/fi";
import { getRepoHealth } from "../api";

function ago(iso) {
  const days = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (!Number.isFinite(days) || days < 0) return "";
  if (days < 1) return "today";
  if (days < 30) return `${Math.floor(days)}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function RepoHealth() {
  const [repos, setRepos] = useState(null);

  useEffect(() => {
    getRepoHealth().then((data) => setRepos(data?.repos ?? [])).catch(() => {});
  }, []);

  if (!repos?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Project repository health">
      {repos.map((repo) => (
        <a
          key={repo.repo}
          href={repo.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card flex items-center gap-2 px-3 py-2 font-mono text-xs text-slate-300 transition-colors hover:border-accent/50 hover:text-white"
        >
          <span className="font-semibold text-white">{repo.repo}</span>
          {repo.language && <span className="text-slate-500">{repo.language}</span>}
          <span className="flex items-center gap-1 text-accent/80">
            <FiStar aria-hidden="true" /> {repo.stars}
          </span>
          <span className="text-slate-500">{ago(repo.pushed_at)}</span>
        </a>
      ))}
    </div>
  );
}
