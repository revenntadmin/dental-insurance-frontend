import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useClaim } from '@/features/claims/useClaim';
import { useSubmitClaim } from '@/features/claims/useSubmitClaim';
import { useToast } from '@/hooks/useToast';
import { api_error_message } from '@/lib/api_client';
import { format_money, format_date } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ClaimSubmitPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: claim, isLoading } = useClaim(pid, claim_id);
  const submit = useSubmitClaim(pid, claim_id);
  const [confirmed, set_confirmed] = useState(false);
  const [rejection, set_rejection] = useState(null);

  async function on_submit() {
    set_rejection(null);
    try {
      const result = await submit.mutateAsync();
      toast.success(`Submitted — control number ${result.control_number}`);
      navigate(`/p/${pid}/claims/${claim_id}`);
    } catch (err) {
      const reasons = err?.response?.data?.rejection_reasons;
      if (reasons?.length) set_rejection(reasons);
      else toast.error(api_error_message(err));
    }
  }

  if (isLoading || !claim) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Submit claim" description="Confirm details before sending to the clearinghouse." />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Patient" value={claim.patient_name} />
            <Field label="Service date" value={format_date(claim.service_date)} />
            <Field label="Payer" value={claim.payer_name} />
            <Field label="Total billed" value={format_money(claim.billed_total)} />
            <Field label="CDT codes" value={(claim.cdt_codes || []).join(', ')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => set_confirmed(e.target.checked)} />
            I confirm this claim is ready
          </label>
          {rejection && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">Rejected by clearinghouse</p>
              <ul className="ml-4 mt-1 list-disc">
                {rejection.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={on_submit} disabled={!confirmed || submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || '—'}</p>
    </div>
  );
}
