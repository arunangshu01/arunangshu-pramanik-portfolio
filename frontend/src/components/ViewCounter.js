import { useEffect, useState } from "react";
import { ANALYTICS_ENABLED, getViewStats, updateViewPresence } from "../api";

let identity;

function getIdentity() {
  if (identity) return identity;
  const viewId = window.crypto.randomUUID();
  let sessionId;
  try {
    sessionId = sessionStorage.getItem("portfolio-view-session");
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(sessionId || "")) {
      sessionId = window.crypto.randomUUID();
      sessionStorage.setItem("portfolio-view-session", sessionId);
    }
  } catch {
    sessionId = window.crypto.randomUUID();
  }
  identity = { viewId, sessionId };
  return identity;
}

export default function ViewCounter() {
  const [counts, setCounts] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let timer;
    let requestTimeout;
    let controller;

    const stop = () => {
      generation += 1;
      clearTimeout(timer);
      clearTimeout(requestTimeout);
      controller?.abort();
    };

    const poll = async () => {
      const attempt = ++generation;
      controller = new AbortController();
      const currentController = controller;
      const timeout = setTimeout(() => currentController.abort(), 10000);
      requestTimeout = timeout;
      let delay = 30000;
      try {
        const ids = ANALYTICS_ENABLED ? getIdentity() : null;
        const result = ids
          ? await updateViewPresence(ids.viewId, ids.sessionId, currentController.signal)
          : await getViewStats(currentController.signal);
        if (!Number.isSafeInteger(result.total_views) || result.total_views < 0 ||
            !Number.isSafeInteger(result.viewing_now) || result.viewing_now < 0) {
          throw new Error("Invalid view statistics");
        }
        if (!disposed && attempt === generation) {
          setCounts(result);
          setUnavailable(false);
        }
      } catch (error) {
        if (error.status === 429) delay = 60000;
        if (!disposed && attempt === generation) {
          setCounts(null);
          setUnavailable(true);
        }
      } finally {
        clearTimeout(timeout);
        if (!disposed && attempt === generation && document.visibilityState !== "hidden") {
          timer = setTimeout(poll, delay);
        }
      }
    };

    const onVisibility = () => {
      stop();
      if (document.visibilityState !== "hidden") poll();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-xs text-slate-400"
      title="Page loads, not unique people. Viewing now estimates browser sessions active in the last 90 seconds. Updates about every 30 seconds.">
      {counts ? (
        <>
          <span>{counts.total_views.toLocaleString("en-US")} total views</span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            {counts.viewing_now.toLocaleString("en-US")} viewing now <span className="text-slate-500">(approx.)</span>
          </span>
        </>
      ) : unavailable ? "View stats unavailable" : "Loading view stats…"}
    </p>
  );
}
