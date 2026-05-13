import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useDebounce } from '@/hooks/useDebounce';
import { useClaimsWorklist } from '@/features/claims/useClaimsWorklist';
import { format_money, format_date } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

const STATUS_OPTIONS = [
  '', 'draft', 'validated', 'submitted', 'accepted', 'rejected', 'paid', 'denied', 'appealed',
];

export function ClaimsWorklistPage() {
  const pid = useTenancyParam();
  const [q, set_q] = useState('');
  const [status, set_status] = useState('');
  const debounced = useDebounce(q);
  const { data, isLoading } = useClaimsWorklist(pid, { q: debounced, status: status || undefined, sort: 'action_required' });
  const items = data?.items || [];

  return (
    <div>
      <PageHeader
        title="Claims"
        description="Action-required claims appear first, then sorted by service date."
        actions={
          <Link to={`/p/${pid}/claims/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New claim
            </Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient or claim #"
            value={q}
            onChange={(e) => set_q(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => set_status(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? s : 'All statuses'}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title="No claims yet" description="Create your first claim to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service date</TableHead>
                <TableHead>CDT codes</TableHead>
                <TableHead>Billed</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Pre-Proc?</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to={`/p/${pid}/claims/${c.id}`} className="font-medium hover:underline">
                      {c.patient_name}
                    </Link>
                  </TableCell>
                  <TableCell>{format_date(c.service_date)}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {(c.cdt_codes || []).map((code) => (
                      <Badge key={code} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{format_money(c.billed_total)}</TableCell>
                  <TableCell>{c.payer_name}</TableCell>
                  <TableCell>{c.pre_procedure_id ? 'Y' : 'N'}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <QuickAction pid={pid} claim={c} />
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

function QuickAction({ pid, claim }) {
  if (claim.status === 'draft') {
    return (
      <Link to={`/p/${pid}/claims/${claim.id}/validate`}>
        <Button size="sm" variant="outline">
          Validate
        </Button>
      </Link>
    );
  }
  if (claim.status === 'validated') {
    return (
      <Link to={`/p/${pid}/claims/${claim.id}/submit`}>
        <Button size="sm">Submit</Button>
      </Link>
    );
  }
  if (claim.status === 'denied') {
    return (
      <Link to={`/p/${pid}/claims/${claim.id}`}>
        <Button size="sm" variant="outline">
          Draft Appeal
        </Button>
      </Link>
    );
  }
  if (claim.status === 'paid') {
    return (
      <Link to={`/p/${pid}/era-receipts?claim_id=${claim.id}`}>
        <Button size="sm" variant="ghost">
          View ERA
        </Button>
      </Link>
    );
  }
  return null;
}
