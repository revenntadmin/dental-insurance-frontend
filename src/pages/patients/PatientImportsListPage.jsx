import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PatientImportsListPage() {
  const pid = useTenancyParam();
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'imports'],
    queryFn: () => api.get(`/api/practice/${pid}/imports`).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Import history" />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <EmptyState title="No imports yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run at</TableHead>
                <TableHead>Source file</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Skipped</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{format_datetime(row.created_at)}</TableCell>
                  <TableCell>{row.filename}</TableCell>
                  <TableCell>{row.imported}</TableCell>
                  <TableCell>{row.skipped}</TableCell>
                  <TableCell>{row.errors}</TableCell>
                  <TableCell>{row.created_by_email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
