import { useEffect, useState } from "react";
import { getGithubWrapped } from "../api";

function Chip({ label, value, className = "" }) {
  return (
    <div className={`glass-card min-w-0 p-3 text-center sm:p-4 ${className}`}>
      <p className="truncate font-display text-xl font-bold text-white sm:text-2xl" title={String(value)}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 sm:tracking-[0.2em]">{label}</p>
    </div>
  );
}

export default function GitHubWrapped() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getGithubWrapped().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="mt-3" aria-label="GitHub stats over the last 90 days">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
        Last {data.window_days} days on GitHub
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        <Chip label="events" value={data.total_events} />
        <Chip label="active days" value={data.active_days} />
        <Chip label="current streak" value={`${data.current_streak}d`} />
        <Chip label="top repo" value={data.top_repos?.[0]?.repo ?? "-"} className="col-span-3 sm:col-span-1" />
      </div>
    </div>
  );
}
