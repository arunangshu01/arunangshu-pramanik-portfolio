// Shared live view stats. ViewCounter already polls /analytics/views every
// ~30s; publishing its result here lets other components (e.g. the Stats
// section) show the same numbers without extra requests. `null` means no
// live snapshot yet - callers should fall back to their own data source.
let snapshot = null;
const listeners = new Set();

export function publishLiveStats(stats) {
  snapshot = stats;
  listeners.forEach((listener) => listener());
}

export function subscribeLiveStats(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLiveStats() {
  return snapshot;
}
