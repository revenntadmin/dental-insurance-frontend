import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Input from '../../components/ui/Input.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { apiClient } from '../../lib/api_client.js';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ actor_email: '', action: '', resource_type: '' });
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_audit_logs', filters],
    queryFn: async () => (await apiClient.get('/api/admin/audit_logs', { params: filters })).data,
  });

  return (
    <div>
      <PageHeader title="Audit logs" subtitle="Every PHI access and configuration change" />

      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input label="Actor email" value={filters.actor_email} onChange={(e) => setFilters({ ...filters, actor_email: e.target.value })} />
        <Input label="Action" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} placeholder="e.g. patient.view" />
        <Input label="Resource type" value={filters.resource_type} onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })} placeholder="patient, claim, …" />
      </div>

      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? <EmptyState title="No audit entries match these filters" /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Timestamp</th>
                  <th className="px-5 py-2">Actor</th>
                  <th className="px-5 py-2">Action</th>
                  <th className="px-5 py-2">Resource</th>
                  <th className="px-5 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.audit_log_id} className="table-row">
                    <td className="px-5 py-2">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-5 py-2">{e.actor_email}</td>
                    <td className="px-5 py-2">{e.action}</td>
                    <td className="px-5 py-2">{e.resource_type}:{e.resource_id}</td>
                    <td className="px-5 py-2 text-xs text-slate-500">{e.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
