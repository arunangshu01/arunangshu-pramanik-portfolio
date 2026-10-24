import { useEffect, useState } from "react";

// Render's free tier sleeps when idle; while it wakes, requests fail with
// 502/503/504 (often surfacing as a network TypeError since the error page has
// no CORS headers). Those are retried; real errors like 404/422 are not.
const RETRYABLE_STATUS = new Set([502, 503, 504]);
export const isRetryable = (error) =>
  error?.name === "TypeError" || RETRYABLE_STATUS.has(error?.status);

export const DEFAULT_RETRY_DELAYS = [2000, 4000, 8000, 15000];

export function useApi(
  fetcher,
  { retryDelays = DEFAULT_RETRY_DELAYS, slowAfter = 4000 } = {}
) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    slow: false,
  });

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    const slowTimer = setTimeout(
      () => !cancelled && setState((s) => (s.loading ? { ...s, slow: true } : s)),
      slowAfter
    );
    const finish = (next) => {
      clearTimeout(slowTimer);
      setState({ slow: false, ...next });
    };

    const attempt = (n) =>
      fetcher()
        .then((data) => !cancelled && finish({ data, loading: false, error: null }))
        .catch((error) => {
          if (cancelled) return;
          if (n < retryDelays.length && isRetryable(error)) {
            retryTimer = setTimeout(() => attempt(n + 1), retryDelays[n]);
          } else {
            finish({ data: null, loading: false, error });
          }
        });
    attempt(0);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
