import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api_client.js';
import { usePracticeId } from '../../hooks/use_practice.js';

export function useDashboardMetrics() {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['dashboard_metrics', practice_id],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/dashboard/metrics`);
      return data;
    },
  });
}

export function useDashboardWorklist() {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['dashboard_worklist', practice_id],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/dashboard/worklist`);
      return data;
    },
  });
}

export function useDashboardAlerts() {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['dashboard_alerts', practice_id],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/dashboard/alerts`);
      return data;
    },
  });
}
