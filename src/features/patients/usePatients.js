import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function usePatients(pid, params = {}) {
  return useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'patients', params],
    queryFn: () => api.get(`/api/practice/${pid}/patients`, { params }).then((r) => r.data),
  });
}
