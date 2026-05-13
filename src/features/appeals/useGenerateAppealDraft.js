import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useGenerateAppealDraft(pid, claim_id) {
  return useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims/${claim_id}/appeals/draft`).then((r) => r.data),
  });
}
