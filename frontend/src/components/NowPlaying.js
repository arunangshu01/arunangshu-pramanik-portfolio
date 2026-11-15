import { useEffect, useState } from "react";
import { getNowStatus } from "../api";

const KIND_LABEL = {
  building: "Building",
  reading: "Reading",
  learning: "Learning",
  exploring: "Exploring",
  listening: "Listening",
};

export default function NowPlaying() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getNowStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status?.label) return null;

  const content = (
    <span className="flex items-center gap-2 text-sm text-slate-300">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="truncate">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {KIND_LABEL[status.kind] ?? "Now"}
        </span>
        {" · "}
        {status.label}
      </span>
    </span>
  );

  const className =
    "glass-card block w-full p-3 transition-colors hover:border-accent/50 sm:w-auto";

  return status.url ? (
    <a href={status.url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
