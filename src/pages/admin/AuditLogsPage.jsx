import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function AuditLogsPage() {
  const [filters, set_filters] = useState({ from: '', to: '', practice_id: '', user_id: '', action: '' });
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit_logs', filters],
    queryFn: () =>
      api
        .get('/api/admin/audit_logs', {
          params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        })
        .then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Audit logs" description="Action, resource, timestamp — no PHI." />
      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-5">
          <FilterField label="From" id="from" type="date" value={filters.from} on_change={(v) => set_filters((f) => ({ ...f, from: v }))} />
          <FilterField label="To" id="to" type="date" value={filters.to} on_change={(v) => set_filters((f) => ({ ...f, to: v }))} />
          <FilterField label="Practice ID" id="practice_id" value={filters.practice_id} on_change={(v) => set_filters((f) => ({ ...f, practice_id: v }))} />
          <FilterField label="User ID" id="user_id" value={filters.user_id} on_change={(v) => set_filters((f) => ({ ...f, user_id: v }))} />
          <FilterField label="Action" id="action" value={filters.action} on_change={(v) => set_filters((f) => ({ ...f, action: v }))} />
        </CardContent>
      </Card>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items || []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{format_datetime(l.created_at)}</TableCell>
                  <TableCell>{l.actor_email || 'system'}</TableCell>
                  <TableCell className="font-mono text-xs">{l.action}</TableCell>
                  <TableCell>{l.resource_type}</TableCell>
                  <TableCell className="font-mono text-xs">{l.resource_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function FilterField({ label, id, type = 'text', value, on_change }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => on_change(e.target.value)} />
    </div>
  );
}
