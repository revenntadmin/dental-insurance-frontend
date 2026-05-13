import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useClaimsWorklist(pid, params = {}) {
  return useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'claims', params],
    queryFn: () => api.get(`/api/practice/${pid}/claims`, { params }).then((r) => r.data),
  });
}
