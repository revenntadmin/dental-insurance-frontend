import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Info, RefreshCw, Pencil, Send } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useValidateClaim } from '@/features/claims/useValidateClaim';
import { useClaim } from '@/features/claims/useClaim';
import { useToast } from '@/hooks/useToast';
import { api_error_message } from '@/lib/api_client';
import { format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const SEVERITY_BADGE = {
  error: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function ClaimValidationPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: claim } = useClaim(pid, claim_id);
  const validate = useValidateClaim(pid, claim_id);

  useEffect(() => {
    if (!validate.data && !validate.isPending) {
      validate.mutate(undefined, { onError: (e) => toast.error(api_error_message(e)) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = validate.data;
  const counts = useMemo(() => {
    const issues = result?.issues || [];
    return {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };
  }, [result]);

  const layer1 = result?.coverage;
  const layer2 = (result?.issues || []).filter((i) => i.layer === 'rule');
  const layer3 = (result?.issues || []).filter((i) => i.layer === 'ai');
  const ai_unavailable = result?.ai_unavailable;

  return (
    <div>
      <PageHeader
        title="Validation"
        description={claim ? `${claim.patient_name} · ${format_money(claim.billed_total)}` : ''}
        actions={
          <Button variant="outline" onClick={() => validate.mutate()} disabled={validate.isPending}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-validate
          </Button>
        }
      />

      {validate.isPending && !result && <LoadingSpinner />}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Layer 1: Coverage{' '}
              {layer1 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({layer1.source === 'pre_procedure'
                    ? `from Pre-Procedure run ${layer1.days_ago ?? '?'} days ago`
                    : 'fresh check, just now'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!layer1 ? (
              <p className="text-sm text-muted-foreground">No coverage data.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <li>Coverage active: {layer1.active ? 'Yes' : 'No'}</li>
                <li>Coverage %: {layer1.coverage_percent ?? '—'}</li>
                <li>Deductible: {format_money(layer1.deductible)}</li>
                <li>Est. patient: {format_money(layer1.est_patient)}</li>
                <li>Approval likelihood: {layer1.approval_likelihood ?? '—'}</li>
                <li>Pre-auth required: {layer1.pre_auth_required ? 'Yes' : 'No'}</li>
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer 2: Rule-Based Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {layer2.length === 0 ? (
              <p className="inline-flex items-center text-sm text-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> All rule checks passed
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {layer2.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <SeverityIcon severity={i.severity} />
                    <span>{i.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layer 3: AI Validation</CardTitle>
          </CardHeader>
          <CardContent>
            {ai_unavailable && (
              <div className="mb-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                AI validation is unavailable right now. Layers 1 and 2 still apply.
              </div>
            )}
            {layer3.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI suggestions.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {layer3.map((i, idx) => (
                  <li key={idx} className="rounded-md border p-3">
                    <span className={`mb-2 inline-flex rounded-full border px-2 py-0.5 text-xs ${SEVERITY_BADGE[i.severity] || ''}`}>
                      {i.severity}
                    </span>
                    <p className="mt-1">{i.message}</p>
                    {i.explanation && <p className="mt-1 text-muted-foreground">{i.explanation}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-md border bg-card p-4 text-sm">
        <p>
          {counts.errors} Errors · {counts.warnings} Warnings · {counts.info} Info
        </p>
        <div className="flex gap-2">
          <Link to={`/p/${pid}/claims/${claim_id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" /> Edit claim
            </Button>
          </Link>
          <Button
            disabled={counts.errors > 0}
            onClick={() => navigate(`/p/${pid}/claims/${claim_id}/submit`)}
          >
            <Send className="mr-2 h-4 w-4" />
            {counts.warnings > 0 ? `Submit (${counts.warnings} Warning — Confirm)` : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SeverityIcon({ severity }) {
  if (severity === 'error') return <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />;
  if (severity === 'warning') return <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />;
  if (severity === 'info') return <Info className="mt-0.5 h-4 w-4 text-blue-600" />;
  return <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />;
}
