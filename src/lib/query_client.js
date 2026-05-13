import { QueryClient } from '@tanstack/react-query';

export const query_client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const QUERY_KEYS = {
  worklist: (pid) => ['practice', pid, 'worklist'],
  documents: (pid, patient_id) => ['practice', pid, 'documents', { patient_id }],
  imports: (pid) => ['practice', pid, 'imports'],
  intake_submissions_pending: (pid) => ['practice', pid, 'intake_submissions', { status: 'pending_review' }],
  intake_submission: (pid, submission_id) => ['practice', pid, 'intake_submissions', submission_id],
  eligibility: (pid, patient_insurance_id) => ['practice', pid, 'eligibility', patient_insurance_id],
  patient_insurances: (pid, patient_id) => ['practice', pid, 'patients', patient_id, 'insurances'],
};
