import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { format_date } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PreProcedureHistoryPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
  const { data, isLoading } = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'patients', patient_id, 'pre_procedures'],
    queryFn: () => api.get(`/api/practice/${pid}/patients/${patient_id}/pre_procedures`).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Pre-procedure history" />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <EmptyState title="No checks yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Procedures</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/pre-procedure/${p.id}`} className="text-primary hover:underline">
                      {format_date(p.service_date)}
                    </Link>
                  </TableCell>
                  <TableCell>{p.payer_name}</TableCell>
                  <TableCell>{(p.cdt_codes || []).join(', ')}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
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
