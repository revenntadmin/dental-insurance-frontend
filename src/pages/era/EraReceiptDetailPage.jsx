import { Link, useParams } from 'react-router-dom';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useEraReceipt } from '@/features/era/useEraReceipts';
import { format_date, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function EraReceiptDetailPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const { data, isLoading } = useEraReceipt(pid, id);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title={`ERA ${data.check_number}`}
        description={`${data.payer_name} · ${format_date(data.received_at)} · ${format_money(data.total_paid)}`}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Adj</TableHead>
                <TableHead>Denial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.era_lines || []).map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/claims/${line.claim_id}`} className="text-primary hover:underline">
                      {line.claim_control_number || line.claim_id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{line.patient_name}</TableCell>
                  <TableCell>{format_money(line.paid_amount)}</TableCell>
                  <TableCell>{format_money(line.patient_amount)}</TableCell>
                  <TableCell>{format_money(line.adjustment_amount)}</TableCell>
                  <TableCell>{(line.denial_codes || []).join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
