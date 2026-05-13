import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function EligibilityHistoryPage() {
  const pid = useTenancyParam();
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'eligibility', 'checks'],
    queryFn: () => api.get(`/api/practice/${pid}/eligibility/checks`).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Eligibility history" />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <EmptyState title="No checks yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{format_datetime(r.checked_at)}</TableCell>
                  <TableCell>{r.patient_name}</TableCell>
                  <TableCell>{r.payer_name}</TableCell>
                  <TableCell>{r.coverage_active ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
