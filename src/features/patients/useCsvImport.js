import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useCsvImport(pid) {
  const upload = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/api/practice/${pid}/imports/csv/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });

  const validate = useMutation({
    mutationFn: ({ upload_id, column_mapping }) =>
      api
        .post(`/api/practice/${pid}/imports/csv/${upload_id}/validate`, { column_mapping })
        .then((r) => r.data),
  });

  const confirm = useMutation({
    mutationFn: ({ upload_id, skipped_rows }) =>
      api
        .post(`/api/practice/${pid}/imports/csv/${upload_id}/confirm`, { skipped_rows })
        .then((r) => r.data),
  });

  return { upload, validate, confirm };
}
