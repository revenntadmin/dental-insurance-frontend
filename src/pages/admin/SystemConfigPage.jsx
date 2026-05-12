import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { apiClient } from '../../lib/api_client.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function SystemConfigPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_system_config'],
    queryFn: async () => (await apiClient.get('/api/admin/system_config')).data,
  });
  const [form, setForm] = useState({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => (await apiClient.patch('/api/admin/system_config', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_system_config'] });
      toast('Configuration saved.', 'success');
    },
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <PageHeader title="System configuration" subtitle="Organization-wide defaults and AI thresholds" />
      <div className="card p-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Default CSV import row limit" type="number" value={form.default_csv_import_row_limit ?? ''} onChange={(e) => setForm({ ...form, default_csv_import_row_limit: Number(e.target.value) })} />
          <Input label="Scan session expiry (minutes)" type="number" value={form.scan_session_expiry_minutes ?? ''} onChange={(e) => setForm({ ...form, scan_session_expiry_minutes: Number(e.target.value) })} />
          <Input label="AI confidence threshold (auto-confirm ≥)" type="number" step="0.01" min="0" max="1" value={form.ai_auto_confirm_threshold ?? ''} onChange={(e) => setForm({ ...form, ai_auto_confirm_threshold: Number(e.target.value) })} />
          <Input label="Appeal model" value={form.appeal_model || ''} onChange={(e) => setForm({ ...form, appeal_model: e.target.value })} />
          <Input label="Extraction model" value={form.extraction_model || ''} onChange={(e) => setForm({ ...form, extraction_model: e.target.value })} />
          <Input label="Support email" value={form.support_email || ''} onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
