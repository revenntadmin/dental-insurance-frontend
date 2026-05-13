import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useAppeal(pid, id) {
  return useQuery({
    enabled: !!pid && !!id,
    queryKey: ['practice', pid, 'appeals', id],
    queryFn: () => api.get(`/api/practice/${pid}/appeals/${id}`).then((r) => r.data),
  });
}

export function useUpdateAppeal(pid, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put(`/api/practice/${pid}/appeals/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', pid, 'appeals', id] }),
  });
}

export function useMarkSent(pid, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/appeals/${id}/mark_sent`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', pid, 'appeals', id] }),
  });
}

export function useLogOutcome(pid, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/api/practice/${pid}/appeals/${id}/log_outcome`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['practice', pid, 'appeals', id] }),
  });
}
