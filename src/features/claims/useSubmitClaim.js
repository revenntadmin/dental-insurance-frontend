import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useSubmitClaim(pid, claim_id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims/${claim_id}/submit`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims', claim_id] });
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims'] });
    },
  });
}
