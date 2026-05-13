import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useClaim } from '@/features/claims/useClaim';
import { useSubmitClaim } from '@/features/claims/useSubmitClaim';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { format_money, format_date } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ClaimSubmitPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: claim, isLoading: claim_loading } = useClaim(pid, claim_id);
  const submit = useSubmitClaim(pid, claim_id);
  const [confirmed, set_confirmed] = useState(false);
  const [rejection, set_rejection] = useState(null);
  const [manual_notes, set_manual_notes] = useState('');

  const practice = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'profile'],
    queryFn: () => api.get(`/api/practice/${pid}`).then((r) => r.data),
  });

  const mark_manual = useMutation({
    mutationFn: () =>
      api.post(`/api/practice/${pid}/claims/${claim_id}/mark_manually_submitted`, {
        notes: manual_notes || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Claim marked as manually submitted');
      navigate(`/p/${pid}/claims/${claim_id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

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

  if (claim_loading || practice.isLoading || !claim) return <LoadingSpinner />;

  const no_electronic = !practice.data?.stedi_submitter_id;

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

          {no_electronic ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Electronic submission unavailable</p>
              <p className="mt-1">
                This practice is not enrolled in electronic submission. You can mark this claim as manually submitted after sending it by other means.
              </p>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="manual_notes">Notes (optional)</Label>
                <textarea
                  id="manual_notes"
                  className="h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={manual_notes}
                  onChange={(e) => set_manual_notes(e.target.value)}
                  placeholder="Reference number, fax confirmation, etc."
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        {no_electronic ? (
          <Button onClick={() => mark_manual.mutate()} disabled={mark_manual.isPending}>
            {mark_manual.isPending ? 'Saving…' : 'Mark as Manually Submitted'}
          </Button>
        ) : (
          <Button onClick={on_submit} disabled={!confirmed || submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        )}
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
