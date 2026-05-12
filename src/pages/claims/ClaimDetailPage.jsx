import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { useClaim, useValidateClaim, useSubmitClaim } from '../../features/claims/queries.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function ClaimDetailPage() {
  const { claim_id } = useParams();
  const { data, isLoading, error, refetch } = useClaim(claim_id);
  const validate = useValidateClaim(claim_id);
  const submit = useSubmitClaim(claim_id);
  const { toast } = useToast();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  async function onValidate() {
    try {
      const result = await validate.mutateAsync();
      toast(`Validation: ${result.passed ? 'passed' : 'issues found'}`, result.passed ? 'success' : 'error');
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  async function onSubmit() {
    try {
      await submit.mutateAsync();
      toast('Claim submitted to clearinghouse.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title={`Claim · ${data.claim_number || data.claim_id.slice(0, 8)}`}
        subtitle={`${data.patient_name} · ${data.service_date}`}
        actions={
          <>
            <Button variant="secondary" onClick={onValidate} disabled={validate.isPending}>
              {validate.isPending ? 'Validating…' : 'Validate'}
            </Button>
            {data.status === 'denied' && (
              <Link to={`/claims/${claim_id}/appeal`}><Button variant="secondary">Draft appeal</Button></Link>
            )}
            {(data.status === 'pending' || data.status === 'needs_review') && (
              <Button onClick={onSubmit} disabled={submit.isPending}>
                {submit.isPending ? 'Submitting…' : 'Submit to payer'}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Summary <StatusBadge status={data.status} />
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Patient" value={data.patient_name} />
            <Item label="Service date" value={data.service_date} />
            <Item label="Provider" value={data.rendering_provider_name} />
            <Item label="Carrier" value={data.carrier_name} />
            <Item label="Billed amount" value={`$${((data.billed_amount_cents || 0) / 100).toLocaleString()}`} />
            <Item label="Allowed amount" value={data.allowed_amount_cents != null ? `$${(data.allowed_amount_cents / 100).toLocaleString()}` : '—'} />
            <Item label="Submitted at" value={data.submitted_at ? new Date(data.submitted_at).toLocaleString() : '—'} />
            <Item label="Clearinghouse ref" value={data.clearinghouse_reference || '—'} />
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Service lines</h3>
          <ul className="text-sm space-y-2">
            {data.service_lines?.map((line) => (
              <li key={line.line_id} className="border border-slate-200 rounded p-2">
                <div className="font-medium">{line.cdt_code} · tooth {line.tooth_number || '—'}</div>
                <div className="text-slate-500">{line.description}</div>
                <div className="text-slate-500">${((line.fee_cents || 0) / 100).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>

        {data.validation_issues?.length > 0 && (
          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold mb-3 text-red-700">Validation issues</h3>
            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
              {data.validation_issues.map((issue, i) => (
                <li key={i}>{issue.field ? `${issue.field}: ` : ''}{issue.message}</li>
              ))}
            </ul>
          </div>
        )}

        {data.denial && (
          <div className="card p-5 lg:col-span-3 border border-red-200">
            <h3 className="font-semibold mb-3 text-red-700">Denial details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Reason code" value={data.denial.reason_code} />
              <Item label="Reason" value={data.denial.reason_description} />
              <Item label="Denied at" value={data.denial.denied_at} />
              <Item label="Category" value={data.denial.category} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5">{value ?? '—'}</dd>
    </div>
  );
}
