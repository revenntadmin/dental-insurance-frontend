import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function usePreProcedure(pid, id) {
  return useQuery({
    enabled: !!pid && !!id,
    queryKey: ['practice', pid, 'pre_procedures', id],
    queryFn: () => api.get(`/api/practice/${pid}/pre_procedures/${id}`).then((r) => r.data),
  });
}

export function useCreatePreProcedure(pid) {
  return useMutation({
    mutationFn: (body) => api.post(`/api/practice/${pid}/pre_procedures`, body).then((r) => r.data),
  });
}
