import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { apiClient } from '../../lib/api_client.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_integrations'],
    queryFn: async () => (await apiClient.get('/api/admin/integrations')).data,
  });

  const test = useMutation({
    mutationFn: async (integration_id) => (await apiClient.post(`/api/admin/integrations/${integration_id}/test`)).data,
    onSuccess: (r) => toast(r.ok ? 'Connection OK.' : (r.message || 'Test failed.'), r.ok ? 'success' : 'error'),
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  const toggle = useMutation({
    mutationFn: async ({ integration_id, enabled }) => (await apiClient.patch(`/api/admin/integrations/${integration_id}`, { enabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_integrations'] }),
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Clearinghouse, PMS, and AI providers" />
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items?.map((i) => (
            <div key={i.integration_id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{i.display_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{i.integration_type}</div>
                </div>
                <StatusBadge status={i.status} />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm mt-4">
                <Item label="Vendor" value={i.vendor} />
                <Item label="Environment" value={i.environment} />
                <Item label="Last tested" value={i.last_tested_at ? new Date(i.last_tested_at).toLocaleString() : '—'} />
                <Item label="Enabled" value={i.enabled ? 'Yes' : 'No'} />
              </dl>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => test.mutate(i.integration_id)} disabled={test.isPending}>
                  Test connection
                </Button>
                <Button
                  variant={i.enabled ? 'danger' : 'primary'}
                  onClick={() => toggle.mutate({ integration_id: i.integration_id, enabled: !i.enabled })}
                  disabled={toggle.isPending}
                >
                  {i.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  );
}
