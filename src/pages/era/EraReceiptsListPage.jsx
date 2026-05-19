import { Link } from 'react-router-dom';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useEraReceipts } from '@/features/era/useEraReceipts';
import { format_date, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function EraReceiptsListPage() {
  const pid = useTenancyParam();
  const { data, isLoading } = useEraReceipts(pid);

  return (
    <div>
      <PageHeader title="ERA receipts" />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState title="No ERAs yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Check #</TableHead>
                <TableHead>Total paid</TableHead>
                <TableHead># claims</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/era-receipts/${r.id}`} className="text-primary hover:underline">
                      {format_date(r.received_at)}
                    </Link>
                  </TableCell>
                  <TableCell>{r.payer_name}</TableCell>
                  <TableCell>{r.check_number}</TableCell>
                  <TableCell>{format_money(r.total_paid)}</TableCell>
                  <TableCell>{r.claim_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
