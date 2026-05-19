import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Pencil, RefreshCw, ShieldCheck, Send, Trash2 } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useClaim } from '@/features/claims/useClaim';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_date, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function ClaimDetailPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: claim, isLoading } = useClaim(pid, claim_id);
  const [delete_open, set_delete_open] = useState(false);

  const validation = useQuery({
    enabled: !!pid && !!claim_id,
    queryKey: ['practice', pid, 'claims', claim_id, 'validation'],
    queryFn: () =>
      api.get(`/api/practice/${pid}/claims/${claim_id}/validation_issues`).then((r) => r.data),
  });

  const history = useQuery({
    enabled: !!pid && !!claim_id,
    queryKey: ['practice', pid, 'claims', claim_id, 'status_history'],
    queryFn: () => api.get(`/api/practice/${pid}/claims/${claim_id}/status_history`).then((r) => r.data),
  });

  const era = useQuery({
    enabled: !!pid && !!claim_id,
    queryKey: ['practice', pid, 'era_receipts', { claim_id }],
    queryFn: () => api.get(`/api/practice/${pid}/era_receipts`, { params: { claim_id } }).then((r) => r.data),
  });

  const refresh_status = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims/${claim_id}/refresh_status`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims', claim_id] });
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims', claim_id, 'status_history'] });
      toast.success('Status refreshed');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const cob_check = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims/${claim_id}/cob_check`).then((r) => r.data),
    onSuccess: () => toast.success('COB check initiated'),
    onError: (e) => toast.error(api_error_message(e)),
  });

  const delete_claim = useMutation({
    mutationFn: () => api.delete(`/api/practice/${pid}/claims/${claim_id}`).then((r) => r.data),
    onSuccess: () => navigate(`/p/${pid}/claims`),
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!claim) return <EmptyState title="Claim not found" />;

  const can_refresh = claim.status === 'submitted' || claim.status === 'pending_adjudication';

  return (
    <div>
      <PageHeader
        title={`Claim #${claim.control_number || claim.id.slice(0, 8)}`}
        description={`${claim.patient_name} · ${format_date(claim.service_date)} · ${format_money(claim.billed_total)}`}
        actions={
          <>
            <StatusBadge status={claim.status} />
            {claim.status === 'draft' && (
              <>
                <Button variant="outline" onClick={() => navigate(`/p/${pid}/claims/${claim_id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button onClick={() => navigate(`/p/${pid}/claims/${claim_id}/validate`)}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Validate
                </Button>
              </>
            )}
            {claim.status === 'validated' && (
              <Button onClick={() => navigate(`/p/${pid}/claims/${claim_id}/submit`)}>
                <Send className="mr-2 h-4 w-4" /> Submit
              </Button>
            )}
            {claim.status === 'denied' && claim.appeal_id && (
              <Link to={`/p/${pid}/appeals/${claim.appeal_id}`}>
                <Button variant="outline">Open Appeal</Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {claim.status === 'draft' && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => set_delete_open(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete claim
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Tabs defaultValue="procedures">
        <TabsList>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="status">Status history</TabsTrigger>
          <TabsTrigger value="era">ERA</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CDT</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tooth</TableHead>
                    <TableHead>Surfaces</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Patient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(claim.claim_procedures || []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.cdt_code}</TableCell>
                      <TableCell>{p.description}</TableCell>
                      <TableCell>{p.tooth || '—'}</TableCell>
                      <TableCell>{p.surfaces || '—'}</TableCell>
                      <TableCell>{format_money(p.fee)}</TableCell>
                      <TableCell>{format_money(p.paid_amount)}</TableCell>
                      <TableCell>{format_money(p.patient_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {claim.secondary_insurance_id && (
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={() => cob_check.mutate()} disabled={cob_check.isPending}>
                {cob_check.isPending ? 'Checking…' : 'Check COB'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Last validation</CardTitle>
              <Link to={`/p/${pid}/claims/${claim_id}/validate`}>
                <Button size="sm" variant="outline">
                  Open full validation
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {validation.isLoading ? (
                <LoadingSpinner />
              ) : (validation.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No issues recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {validation.data.map((i, idx) => (
                    <li key={idx} className="rounded-md border p-3 text-sm">
                      <span className="font-medium">{i.severity}:</span> {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Status history</CardTitle>
              {can_refresh && (
                <Button size="sm" variant="outline" onClick={() => refresh_status.mutate()} disabled={refresh_status.isPending}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refresh_status.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(history.data || []).map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{format_date(h.changed_at)}</TableCell>
                      <TableCell>
                        <StatusBadge status={h.to_status} />
                      </TableCell>
                      <TableCell>{h.changed_by_email || 'system'}</TableCell>
                      <TableCell>{h.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="era">
          {era.isLoading ? (
            <LoadingSpinner />
          ) : (era.data?.length ?? 0) === 0 ? (
            <EmptyState title="No ERA yet" description="ERA data will appear here once received from the payer." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Check #</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Adj</TableHead>
                      <TableHead>Denial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(era.data || []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.check_number}</TableCell>
                        <TableCell>{format_money(r.total_paid)}</TableCell>
                        <TableCell>{format_money(r.total_patient)}</TableCell>
                        <TableCell>{format_money(r.total_adjustment)}</TableCell>
                        <TableCell>{(r.denial_codes || []).join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={delete_open} onOpenChange={set_delete_open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete claim?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This draft will be permanently deleted and cannot be recovered.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => set_delete_open(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={delete_claim.isPending}
              onClick={() => delete_claim.mutate()}
            >
              {delete_claim.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
