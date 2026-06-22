import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight,
  Upload, UserPlus, X, MoreHorizontal,
  CheckSquare, AlertTriangle,
} from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useDebounce } from '@/hooks/useDebounce';
import { usePatients } from '@/features/patients/usePatients';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { format_date, format_datetime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

const LIMITS = [25, 50, 100];

const SORT_OPTS = [
  { label: 'Last name', value: 'last_name' },
  { label: 'First name', value: 'first_name' },
  { label: 'Date of birth', value: 'date_of_birth' },
  { label: 'Last updated', value: 'updated_at' },
];

function InsuranceStatusBadge({ patient }) {
  if (!patient.primary_payer_name) {
    return <span className="text-xs text-muted-foreground">No insurance</span>;
  }
  if (patient.primary_coverage_active === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  }
  if (patient.primary_coverage_active === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Not verified
    </span>
  );
}

function PatientStatusBadge({ is_active }) {
  if (is_active === false) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Inactive
      </span>
    );
  }
  return null;
}

function SortButton({ col, current_sort, current_dir, on_sort }) {
  const active = current_sort === col;
  return (
    <button
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      onClick={() => on_sort(col)}
    >
      {SORT_OPTS.find((o) => o.value === col)?.label ?? col}
      {active ? (
        current_dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export function PatientsListPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const [q, set_q] = useState('');
  const debounced_q = useDebounce(q, 300);

  const [status_filter, set_status_filter] = useState('active');
  const [ins_filter, set_ins_filter] = useState('');
  const [sort, set_sort] = useState('last_name');
  const [dir, set_dir] = useState('asc');
  const [limit, set_limit] = useState(25);
  const [page, set_page] = useState(1);

  const [selected, set_selected] = useState(new Set());
  const [deactivate_confirm, set_deactivate_confirm] = useState(null);

  const params = {
    q: debounced_q || undefined,
    status: status_filter || undefined,
    sort,
    dir,
    limit,
    page,
  };

  const { data, isLoading, isFetching } = usePatients(pid, params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const total_pages = Math.max(1, Math.ceil(total / limit));

  function toggle_sort(col) {
    if (sort === col) {
      set_dir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      set_sort(col);
      set_dir('asc');
    }
    set_page(1);
  }

  function apply_filter(key, value, setter) {
    setter(value);
    set_page(1);
    set_selected(new Set());
  }

  const visible_ids = items.map((p) => p.id);
  const all_selected = visible_ids.length > 0 && visible_ids.every((id) => selected.has(id));

  function toggle_all() {
    if (all_selected) {
      set_selected((prev) => {
        const next = new Set(prev);
        visible_ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      set_selected((prev) => {
        const next = new Set(prev);
        visible_ids.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggle_row(id) {
    set_selected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const bulk_deactivate = useMutation({
    mutationFn: (ids) =>
      api.post(`/api/practice/${pid}/patients/bulk_deactivate`, { patient_ids: ids }).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`${data.deactivated} patient${data.deactivated !== 1 ? 's' : ''} deactivated`);
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients'] });
      set_selected(new Set());
      set_deactivate_confirm(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const single_deactivate = useMutation({
    mutationFn: (patient_id) =>
      api.post(`/api/practice/${pid}/patients/${patient_id}/deactivate`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Patient deactivated');
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients'] });
      set_deactivate_confirm(null);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const active_filters = [
    status_filter && { label: status_filter === 'active' ? 'Active patients' : 'Inactive patients', clear: () => apply_filter('status', '', set_status_filter) },
    ins_filter && { label: ins_filter === 'verified' ? 'Insurance: Active' : ins_filter === 'unverified' ? 'Insurance: Not verified' : 'No insurance', clear: () => apply_filter('ins', '', set_ins_filter) },
  ].filter(Boolean);

  const filtered_items = ins_filter
    ? items.filter((p) => {
      if (ins_filter === 'no_insurance') return !p.primary_payer_name;
      if (ins_filter === 'verified') return p.primary_coverage_active === true;
      if (ins_filter === 'unverified') return p.primary_payer_name && p.primary_coverage_active == null;
      return true;
    })
    : items;

  return (
    <div>
      <PageHeader
        title="Patients"
        description={total > 0 ? `${total.toLocaleString()} total` : 'No patients yet'}
        actions={
          <>
            <Link to={`/p/${pid}/patients/import`}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            </Link>
            <Link to={`/p/${pid}/patients/new`}>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add Patient
              </Button>
            </Link>
          </>
        }
      />

      {/* Search + Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, DOB, phone, email, member ID…"
          value={q}
          onChange={(e) => { set_q(e.target.value); set_page(1); }}
          className="max-w-sm"
        />

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status_filter}
          onChange={(e) => apply_filter('status', e.target.value, set_status_filter)}
        >
          <option value="">All patients</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={ins_filter}
          onChange={(e) => apply_filter('ins', e.target.value, set_ins_filter)}
        >
          <option value="">All insurance</option>
          <option value="verified">Active coverage</option>
          <option value="unverified">Not verified</option>
          <option value="no_insurance">No insurance</option>
        </select>
      </div>

      {/* Active filter chips */}
      {active_filters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {active_filters.map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs">
              {f.label}
              <button onClick={f.clear} className="ml-0.5 rounded-full hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { set_status_filter(''); set_ins_filter(''); set_q(''); set_page(1); }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2">
          <CheckSquare className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-medium text-amber-800">
            {selected.size} patient{selected.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => set_deactivate_confirm({ ids: [...selected], is_bulk: true })}
          >
            Deactivate selected
          </Button>
          <button
            className="ml-auto text-xs text-amber-700 hover:text-amber-900"
            onClick={() => set_selected(new Set())}
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered_items.length === 0 && !isFetching ? (
          <EmptyState
            title={q || active_filters.length ? 'No patients match your search' : 'No patients yet'}
            description={q || active_filters.length ? 'Try adjusting your filters.' : 'Add a patient or import a CSV to get started.'}
            action={!q && !active_filters.length && (
              <Link to={`/p/${pid}/patients/new`}>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Patient
                </Button>
              </Link>
            )}
          />
        ) : (
          <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={all_selected}
                      onChange={toggle_all}
                      className="h-4 w-4 rounded border-input"
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton col="last_name" current_sort={sort} current_dir={dir} on_sort={toggle_sort} />
                  </TableHead>
                  <TableHead>
                    <SortButton col="date_of_birth" current_sort={sort} current_dir={dir} on_sort={toggle_sort} />
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Primary insurance</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>
                    <SortButton col="updated_at" current_sort={sort} current_dir={dir} on_sort={toggle_sort} />
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered_items.map((p) => (
                  <TableRow key={p.id} className={cn(!p.is_active && 'opacity-60')}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle_row(p.id)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/p/${pid}/patients/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.last_name}, {p.first_name}
                        </Link>
                        <PatientStatusBadge is_active={p.is_active} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{format_date(p.date_of_birth)}</TableCell>
                    <TableCell className="text-sm">{p.phone || '—'}</TableCell>
                    <TableCell className="text-sm">{p.primary_payer_name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{p.primary_member_id || '—'}</TableCell>
                    <TableCell>
                      <InsuranceStatusBadge patient={p} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format_date(p.updated_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/p/${pid}/patients/${p.id}`)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/p/${pid}/patients/${p.id}/edit`)}>
                            Edit
                          </DropdownMenuItem>
                          {p.is_active && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => set_deactivate_confirm({ ids: [p.id], is_bulk: false, name: `${p.first_name} ${p.last_name}` })}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              className="h-8 rounded border border-input bg-background px-2 text-sm"
              value={limit}
              onChange={(e) => { set_limit(Number(e.target.value)); set_page(1); }}
            >
              {LIMITS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page · {total.toLocaleString()} total</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => set_page((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {total_pages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => set_page((p) => p + 1)}
              disabled={page >= total_pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      <Dialog
        open={!!deactivate_confirm}
        onOpenChange={(open) => !open && set_deactivate_confirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deactivate {deactivate_confirm?.is_bulk ? `${deactivate_confirm?.ids?.length} patients` : deactivate_confirm?.name}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deactivated patients are hidden from active views but their records and claims are preserved.
            You can reactivate them by editing the patient.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => set_deactivate_confirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={bulk_deactivate.isPending || single_deactivate.isPending}
              onClick={() => {
                if (deactivate_confirm.is_bulk) {
                  bulk_deactivate.mutate(deactivate_confirm.ids);
                } else {
                  single_deactivate.mutate(deactivate_confirm.ids[0]);
                }
              }}
            >
              {bulk_deactivate.isPending || single_deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
