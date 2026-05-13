import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useClaim(pid, claim_id) {
  return useQuery({
    enabled: !!pid && !!claim_id,
    queryKey: ['practice', pid, 'claims', claim_id],
    queryFn: () => api.get(`/api/practice/${pid}/claims/${claim_id}`).then((r) => r.data),
  });
}
