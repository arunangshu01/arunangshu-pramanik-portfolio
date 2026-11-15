import { useEffect, useState } from "react";
import { getAnalyticsTrends } from "../api";

const label = (event) => event.replaceAll("_", " ");

export default function WarehouseTrends() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalyticsTrends().then(setData).catch(() => {});
  }, []);

  if (!data || data.total_events === 0) return null;

  const daily = Object.entries(data.daily ?? {});
  const events = Object.entries(data.top_events ?? {});
  const max = Math.max(1, ...daily.map(([, count]) => count));

  return (
    <div className="glass-card p-5 sm:p-7" aria-label="Warehouse event trends">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Event trends · BigQuery warehouse · {data.days}d
        </p>
        <p className="font-mono text-xs text-accent">{data.total_events.toLocaleString()} events</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {daily.length > 0 && (
          <div className="flex h-24 items-end gap-1" role="img"
            aria-label="Events per day">
            {daily.map(([date, count]) => (
              <div key={date} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t bg-accent2/60 transition-colors group-hover:bg-accent2"
                  style={{ height: `${Math.max(4, (count / max) * 100)}%` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-edge bg-ink px-1.5 py-0.5 font-mono text-[10px] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                  {count} · {date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
        {events.length > 0 && (
          <ul className="divide-y divide-edge/40">
            {events.map(([event, count]) => (
              <li key={event} className="flex items-center justify-between py-1.5 text-sm">
                <span className="capitalize text-slate-300">{label(event)}</span>
                <span className="font-mono text-xs text-accent">{count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
