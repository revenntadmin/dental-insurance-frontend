import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PracticesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'practices'],
    queryFn: () => api.get('/api/admin/practices').then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Practices"
        actions={
          <Link to="/admin/practices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New practice
            </Button>
          </Link>
        }
      />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <EmptyState title="No practices yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead># users</TableHead>
                <TableHead>Claims 30d</TableHead>
                <TableHead>Stedi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to={`/admin/practices/${p.id}`} className="font-medium text-primary hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.city}, {p.state}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>{p.user_count}</TableCell>
                  <TableCell>{p.claims_30d}</TableCell>
                  <TableCell>{p.stedi_enrolled ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
