import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { format_date } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

const CHIPS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'appeal_accepted', label: 'Accepted' },
  { value: 'appeal_denied', label: 'Denied' },
];

export function AppealsListPage() {
  const pid = useTenancyParam();
  const [status, set_status] = useState('');
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'appeals', { status }],
    queryFn: () => api.get(`/api/practice/${pid}/appeals`, { params: { status: status || undefined } }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Appeals" />
      <div className="mb-4 flex gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            onClick={() => set_status(c.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              status === c.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState title="No appeals" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/appeals/${a.id}`} className="text-primary hover:underline">
                      {a.claim_control_number || a.claim_id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{a.patient_name}</TableCell>
                  <TableCell>{a.payer_name}</TableCell>
                  <TableCell>{format_date(a.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
