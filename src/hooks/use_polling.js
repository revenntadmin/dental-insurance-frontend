import { useQuery } from '@tanstack/react-query';

/**
 * Generic interval poller built on React Query.
 * @param {string[]} key  React Query key.
 * @param {() => Promise<any>} fetcher
 * @param {{ intervalMs?: number, enabled?: boolean, stopWhen?: (data:any)=>boolean }} opts
 */
export function usePolling(key, fetcher, opts = {}) {
  const { intervalMs = 2000, enabled = true, stopWhen } = opts;
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      if (stopWhen && query.state.data && stopWhen(query.state.data)) return false;
      return intervalMs;
    },
    refetchIntervalInBackground: false,
  });
}
