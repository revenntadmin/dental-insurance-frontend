import { useState } from 'react';
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

export function ProvidersListPage() {
  const pid = useTenancyParam();
  const [show_inactive, set_show_inactive] = useState(false);
  const { data, isLoading } = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'providers', { show_inactive }],
    queryFn: () =>
      api.get(`/api/practice/${pid}/providers`, { params: { active: show_inactive ? undefined : true } }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Providers"
        actions={
          <Link to={`/p/${pid}/providers/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New provider
            </Button>
          </Link>
        }
      />
      <div className="mb-3 flex items-center gap-2">
        <input
          id="show_inactive"
          type="checkbox"
          checked={show_inactive}
          onChange={(e) => set_show_inactive(e.target.checked)}
        />
        <label htmlFor="show_inactive" className="text-sm">
          Show inactive
        </label>
      </div>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState title="No providers" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.first_name} {p.last_name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.npi}</TableCell>
                  <TableCell>{p.license_number}</TableCell>
                  <TableCell>{p.specialty}</TableCell>
                  <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Link to={`/p/${pid}/providers/${p.id}/edit`}>
                      <Pencil className="inline h-4 w-4 text-primary" />
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
