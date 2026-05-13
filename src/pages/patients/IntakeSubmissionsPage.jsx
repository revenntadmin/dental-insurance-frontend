import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function IntakeSubmissionsPage() {
  const pid = useTenancyParam();
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'intake_submissions', { status: 'pending_review' }],
    queryFn: () =>
      api.get(`/api/practice/${pid}/intake_submissions`, { params: { status: 'pending_review' } }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Intake submissions" description="Review patient-submitted intake forms." />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <EmptyState title="No pending submissions" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/intake-submissions/${s.id}`} className="text-primary hover:underline">
                      {format_datetime(s.submitted_at)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {s.last_name}, {s.first_name}
                  </TableCell>
                  <TableCell>{s.date_of_birth}</TableCell>
                  <TableCell>{s.primary_payer_name || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
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
