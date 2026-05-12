import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api_client.js';
import { usePracticeId } from '../../hooks/use_practice.js';

export function usePatients(params = {}) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['patients', practice_id, params],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/patients`, { params });
      return data;
    },
  });
}

export function usePatient(patient_id) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['patient', patient_id],
    enabled: !!patient_id && !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/patients/${patient_id}`);
      return data;
    },
  });
}

export function useCreatePatient() {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(`/api/practice/${practice_id}/patients`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient(patient_id) {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await apiClient.patch(`/api/practice/${practice_id}/patients/${patient_id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient', patient_id] });
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUploadDocument() {
  const practice_id = usePracticeId();
  return useMutation({
    mutationFn: async ({ file, document_type }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('document_type', document_type || 'insurance_card');
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/documents/extract`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
  });
}

// QR scan sessions (desktop side — authenticated)
export function useCreateScanSession() {
  const practice_id = usePracticeId();
  return useMutation({
    mutationFn: async ({ document_type } = {}) => {
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/scan_sessions`,
        { document_type: document_type || 'insurance_card' }
      );
      return data; // { session_id, qr_url, expires_at }
    },
  });
}

export function useScanSessionPoll(session_id, enabled) {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['scan_session', practice_id, session_id],
    enabled: !!session_id && !!practice_id && !!enabled,
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/practice/${practice_id}/scan_sessions/${session_id}`
      );
      return data; // { status, extracted_fields?, photo_url? }
    },
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      if (s === 'completed' || s === 'expired' || s === 'error') return false;
      return 2000;
    },
  });
}

// Intake submissions (front-desk review queue)
export function useIntakeSubmissions(status = 'pending_review') {
  const practice_id = usePracticeId();
  return useQuery({
    queryKey: ['intake_submissions', practice_id, status],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/practice/${practice_id}/intake_submissions`,
        { params: { status } }
      );
      return data;
    },
  });
}

export function useConfirmIntakeSubmission() {
  const practice_id = usePracticeId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ submission_id, body }) => {
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/intake_submissions/${submission_id}/confirm`,
        body
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intake_submissions'] }),
  });
}
