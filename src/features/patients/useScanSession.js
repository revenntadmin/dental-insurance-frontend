import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useScanSession(pid, scan_type = 'patient_info') {
  const [session, set_session] = useState(null);

  const create = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/scan_sessions`, { scan_type }).then((r) => r.data),
    onSuccess: (data) => set_session(data),
  });

  const status_query = useQuery({
    enabled: !!session?.session_id,
    queryKey: ['practice', pid, 'scan_sessions', session?.session_id],
    queryFn: () =>
      api.get(`/api/practice/${pid}/scan_sessions/${session.session_id}`).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      return data.status === 'pending' ? 2000 : false;
    },
  });

  const send_sms = useMutation({
    mutationFn: () =>
      api
        .post(`/api/practice/${pid}/scan_sessions/${session.session_id}/send_sms`)
        .then((r) => r.data),
  });

  useEffect(() => {
    return () => {
      // cleanup handled by react-query unmount; nothing to abort manually
    };
  }, []);

  return {
    session,
    status: status_query.data?.status || null,
    extracted: status_query.data?.extracted_result || null,
    create_session: create.mutateAsync,
    creating: create.isPending,
    send_sms: send_sms.mutateAsync,
    sending_sms: send_sms.isPending,
    reset: () => set_session(null),
  };
}
