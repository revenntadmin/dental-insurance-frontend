import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge } from '@/components/StatusBadge';

export function SystemHealthPage() {
  const queues = useQuery({ queryKey: ['admin', 'health', 'queues'], queryFn: () => api.get('/api/admin/health/queues').then((r) => r.data) });
  const db = useQuery({ queryKey: ['admin', 'health', 'db'], queryFn: () => api.get('/api/admin/health/db').then((r) => r.data) });
  const clearinghouse = useQuery({ queryKey: ['admin', 'health', 'clearinghouse'], queryFn: () => api.get('/api/admin/health/clearinghouse').then((r) => r.data) });
  const failed = useQuery({
    queryKey: ['admin', 'health', 'failed_tx'],
    queryFn: () => api.get('/api/admin/health/failed_transactions').then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="System health" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue depth</CardTitle>
          </CardHeader>
          <CardContent>
            {queues.isLoading ? <LoadingSpinner /> : (
              <ul className="space-y-1 text-sm">
                {Object.entries(queues.data || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">DB stats</CardTitle>
          </CardHeader>
          <CardContent>
            {db.isLoading ? <LoadingSpinner /> : (
              <ul className="space-y-1 text-sm">
                {Object.entries(db.data || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span>{String(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clearinghouse</CardTitle>
          </CardHeader>
          <CardContent>
            {clearinghouse.isLoading ? <LoadingSpinner /> : (
              <ul className="space-y-1 text-sm">
                {Object.entries(clearinghouse.data || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span>{String(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent failed transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {failed.isLoading ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(failed.data?.items || []).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format_datetime(tx.created_at)}</TableCell>
                    <TableCell>{tx.tx_type}</TableCell>
                    <TableCell>{tx.practice_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
