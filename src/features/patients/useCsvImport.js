import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useCsvImport(pid) {
  const upload = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/api/practice/${pid}/patients/import/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });

  const suggest = useMutation({
    mutationFn: ({ upload_id }) =>
      api.post(`/api/practice/${pid}/patients/import/${upload_id}/suggest_mapping`).then((r) => r.data),
  });

  const validate = useMutation({
    mutationFn: ({ upload_id, column_map }) =>
      api
        .post(`/api/practice/${pid}/patients/import/${upload_id}/validate`, { column_map })
        .then((r) => r.data),
  });

  const confirm = useMutation({
    mutationFn: ({ upload_id, skipped_rows }) =>
      api
        .post(`/api/practice/${pid}/patients/import/${upload_id}/confirm`, { skipped_rows })
        .then((r) => r.data),
  });

  return { upload, suggest, validate, confirm };
}
