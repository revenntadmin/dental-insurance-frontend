import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function usePatient(pid, patient_id) {
  return useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'patients', patient_id],
    queryFn: () => api.get(`/api/practice/${pid}/patients/${patient_id}`).then((r) => r.data),
  });
}
