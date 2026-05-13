import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api_client';

export function useExtractDocument(pid) {
  return useMutation({
    mutationFn: async ({ file, document_type }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', document_type);
      const { data } = await api.post(`/api/practice/${pid}/documents/extract`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}
