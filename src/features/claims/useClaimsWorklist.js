import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useClaimsWorklist(pid, params = {}) {
  const { q, status, ...rest } = params;
  const is_filtered = !!(q || status);

  return useQuery({
    enabled: !!pid,
    queryKey: is_filtered
      ? ['practice', pid, 'claims', { q, status, ...rest }]
      : ['practice', pid, 'worklist'],
    queryFn: () =>
      is_filtered
        ? api.get(`/api/practice/${pid}/claims`, { params: { q, status, ...rest } }).then((r) => r.data)
        : api.get(`/api/practice/${pid}/worklist`).then((r) => r.data),
  });
}
