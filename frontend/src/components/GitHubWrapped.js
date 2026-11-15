import { useEffect, useState } from "react";
import { getGithubWrapped } from "../api";

function Chip({ label, value }) {
  return (
    <div className="glass-card flex-1 p-4 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
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
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Chip label="events" value={data.total_events} />
        <Chip label="active days" value={data.active_days} />
        <Chip label="current streak" value={`${data.current_streak}d`} />
        <Chip label="top repo" value={data.top_repos?.[0]?.repo ?? "—"} />
      </div>
    </div>
  );
}
