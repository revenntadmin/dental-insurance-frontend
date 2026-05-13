import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePreProcedure } from '@/features/pre_procedure/usePreProcedure';
import { api } from '@/lib/api_client';
import { format_money, format_datetime } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

export function PreProcedureResultPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePreProcedure(pid, id);

  const rerun = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/pre_procedures/${id}/rerun`).then((r) => r.data),
    onSuccess: (next) => navigate(`/p/${pid}/pre-procedure/${next.id || id}`),
  });

  if (isLoading || !data) return <LoadingSpinner />;
  const c = data.coverage || {};

  return (
    <div>
      <PageHeader
        title="Pre-procedure result"
        description={`${data.patient_name} · ${data.payer_name} · Checked at ${format_datetime(data.checked_at)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => rerun.mutate()} disabled={rerun.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" /> Re-run
            </Button>
            <Button onClick={() => navigate(`/p/${pid}/claims/new?pre_procedure_id=${id}`)}>
              Use in Claim <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <Row label="Status" value={c.status} />
              <Row label="Coverage %" value={c.coverage_percent != null ? `${c.coverage_percent}%` : '—'} />
              <Row label="Deductible (annual/met)" value={`${format_money(c.deductible_annual)} / ${format_money(c.deductible_met)}`} />
              <Row label="Annual max" value={format_money(c.annual_max)} />
              <Row label="Fee" value={format_money(c.fee)} />
              <Row label="Est. patient" value={format_money(c.est_patient)} />
              <Row label="Est. insurance" value={format_money(c.est_insurance)} />
              <Row label="Approval likelihood" value={<Badge variant="secondary">{c.approval_likelihood}</Badge>} />
              <Row label="Pre-auth required" value={c.pre_auth_required ? 'Yes' : 'No'} />
              <Row label="Frequency limit" value={c.frequency_limit_text || '—'} />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.required_docs?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No documentation required.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.required_docs.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <div>
                      <p className="font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.required ? '(Required' : '(Optional'} —{' '}
                        {d.source === 'standard' ? 'standard' : `${data.payer_name}`})
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <li className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </li>
  );
}
