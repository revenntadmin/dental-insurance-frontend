import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useInsurancePlans(pid, q = '') {
  return useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'insurance_plans', q],
    queryFn: () => api.get(`/api/practice/${pid}/insurance_plans`, { params: { q } }).then((r) => r.data),
    staleTime: 60_000,
  });
}
