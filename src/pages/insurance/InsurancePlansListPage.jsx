import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function InsurancePlansListPage() {
  const pid = useTenancyParam();
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'insurance_plans'],
    queryFn: () => api.get(`/api/practice/${pid}/insurance_plans`).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Insurance plans"
        description="Payer master list for this practice."
        actions={
          <Link to={`/p/${pid}/insurance-plans/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New plan
            </Button>
          </Link>
        }
      />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState title="No insurance plans" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payer name</TableHead>
                <TableHead>Payer ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead># patients</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.payer_name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.payer_id}</TableCell>
                  <TableCell>{p.payer_phone || '—'}</TableCell>
                  <TableCell>{p.patient_count ?? 0}</TableCell>
                  <TableCell>
                    <Link to={`/p/${pid}/insurance-plans/${p.id}/edit`} className="text-primary hover:underline">
                      <Pencil className="inline h-4 w-4" />
                    </Link>
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
