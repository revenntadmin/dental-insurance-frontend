import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useEraReceipts(pid, params = {}) {
  return useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'era_receipts', params],
    queryFn: () => api.get(`/api/practice/${pid}/era_receipts`, { params }).then((r) => r.data),
  });
}

export function useEraReceipt(pid, id) {
  return useQuery({
    enabled: !!pid && !!id,
    queryKey: ['practice', pid, 'era_receipts', id],
    queryFn: () => api.get(`/api/practice/${pid}/era_receipts/${id}`).then((r) => r.data),
  });
}
