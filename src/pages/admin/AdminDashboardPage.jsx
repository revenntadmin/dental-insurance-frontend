import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function AdminDashboardPage() {
  const queues = useQuery({ queryKey: ['admin', 'health', 'queues'], queryFn: () => api.get('/api/admin/health/queues').then((r) => r.data) });
  const db = useQuery({ queryKey: ['admin', 'health', 'db'], queryFn: () => api.get('/api/admin/health/db').then((r) => r.data) });
  const ch = useQuery({ queryKey: ['admin', 'health', 'clearinghouse'], queryFn: () => api.get('/api/admin/health/clearinghouse').then((r) => r.data) });
  const logs = useQuery({
    queryKey: ['admin', 'audit_logs', { limit: 50 }],
    queryFn: () => api.get('/api/admin/audit_logs', { params: { limit: 50 } }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Admin dashboard" description="System health and recent activity" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HealthCard title="Queue depth" data={queues.data} loading={queues.isLoading} fields={['pending', 'in_flight', 'failed']} />
        <HealthCard title="DB latency" data={db.data} loading={db.isLoading} fields={['p50_ms', 'p95_ms', 'active_connections']} />
        <HealthCard title="Clearinghouse" data={ch.data} loading={ch.isLoading} fields={['status', 'last_checked_at']} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.isLoading ? (
            <LoadingSpinner />
          ) : (
            <ul className="divide-y text-sm">
              {(logs.data?.items || []).map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">{l.actor_email || 'system'}</span> · {l.action} · {l.resource_type}
                  </span>
                  <span className="text-xs text-muted-foreground">{format_datetime(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCard({ title, data, loading, fields }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ul className="space-y-1 text-sm">
            {fields.map((f) => (
              <li key={f} className="flex items-center justify-between">
                <span className="text-muted-foreground">{f}</span>
                <span>{data?.[f] ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
