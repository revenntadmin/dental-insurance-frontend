import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api_client';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function UsersListPage() {
  const [q, set_q] = useState('');
  const dq = useDebounce(q);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { q: dq }],
    queryFn: () => api.get('/api/admin/users', { params: { q: dq } }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        actions={
          <Link to="/admin/users/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Invite user
            </Button>
          </Link>
        }
      />
      <Input placeholder="Search by email or name" value={q} onChange={(e) => set_q(e.target.value)} className="mb-3 max-w-md" />
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items || []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link to={`/admin/users/${u.id}`} className="text-primary hover:underline">
                      {u.email}
                    </Link>
                  </TableCell>
                  <TableCell>{u.first_name} {u.last_name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.practice_name || '—'}</TableCell>
                  <TableCell>{u.mfa_enrolled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{u.active ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
