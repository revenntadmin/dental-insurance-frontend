import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api_client.js';
import { usePracticeId } from '../../hooks/use_practice.js';

export function useClaims(params = {}) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['claims', practice_id, params],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/claims`, { params });
      return data;
    },
  });
}

export function useClaim(claim_id) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['claim', claim_id],
    enabled: !!claim_id && !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/claims/${claim_id}`);
      return data;
    },
  });
}

export function useCreateClaim() {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/claims`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claims'] }),
  });
}

export function useValidateClaim(claim_id) {
  const practice_id = usePracticeId();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/claims/${claim_id}/validate`);
      return data;
    },
  });
}

export function useSubmitClaim(claim_id) {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/claims/${claim_id}/submit`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['claim', claim_id] });
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

export function useDraftAppeal(claim_id) {
  const practice_id = usePracticeId();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/claims/${claim_id}/appeal/draft`);
      return data; // { appeal_letter, citations, suggested_attachments }
    },
  });
}

export function useSubmitAppeal(claim_id) {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/claims/${claim_id}/appeal/submit`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claim', claim_id] }),
  });
}

// Pre-procedure (predeterminations / treatment plan checks)
export function usePreProcedures(params = {}) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['pre_procedures', practice_id, params],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/pre_procedure`, { params });
      return data;
    },
  });
}

export function usePreProcedure(pre_procedure_id) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['pre_procedure', pre_procedure_id],
    enabled: !!pre_procedure_id && !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/pre_procedure/${pre_procedure_id}`);
      return data;
    },
  });
}
