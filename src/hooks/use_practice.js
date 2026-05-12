import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api_client.js';

export function useCurrentPractice() {
  return useQuery({
    queryKey: ['current_practice'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/me/practice');
      return data;
    },
  });
}

export function usePracticeId() {
  const { data } = useCurrentPractice();
  return data?.practice_id;
}
