import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, UserPlus } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useDebounce } from '@/hooks/useDebounce';
import { usePatients } from '@/features/patients/usePatients';
import { format_date } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function PatientsListPage() {
  const pid = useTenancyParam();
  const [q, set_q] = useState('');
  const debounced_q = useDebounce(q);
  const { data, isLoading } = usePatients(pid, { q: debounced_q, limit: 50 });
  const items = data || [];

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search, add, and import patient records."
        actions={
          <>
            <Link to={`/p/${pid}/patients/import`}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            </Link>
            <Link to={`/p/${pid}/patients/new`}>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> New Patient
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search by last name, first name, or chart #"
          value={q}
          onChange={(e) => set_q(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title="No patients yet" description="Add a patient or import a CSV to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Last name</TableHead>
                <TableHead>First name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Last visit</TableHead>
                <TableHead>Chart #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/p/${pid}/patients/${p.id}`} className="font-medium hover:underline">
                      {p.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.first_name}</TableCell>
                  <TableCell>{format_date(p.date_of_birth)}</TableCell>
                  <TableCell>{p.primary_payer_name || '—'}</TableCell>
                  <TableCell>{format_date(p.last_visit_at)}</TableCell>
                  <TableCell>{p.chart_number || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
