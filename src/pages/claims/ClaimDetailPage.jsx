import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, ShieldCheck, Send } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useClaim } from '@/features/claims/useClaim';
import { api } from '@/lib/api_client';
import { format_date, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

export function ClaimDetailPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const { data: claim, isLoading } = useClaim(pid, claim_id);

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

  if (isLoading) return <LoadingSpinner />;
  if (!claim) return <EmptyState title="Claim not found" />;

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
                  {(claim.procedures || []).map((p) => (
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
              ) : (validation.data?.issues?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No issues recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {validation.data.issues.map((i, idx) => (
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
                  {(history.data?.items || []).map((h) => (
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
          ) : (era.data?.items?.length ?? 0) === 0 ? (
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
                    {(era.data.items || []).map((r) => (
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
    </div>
  );
}
