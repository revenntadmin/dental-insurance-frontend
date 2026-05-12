import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import {
  useClaim,
  useDraftAppeal,
  useSubmitAppeal,
} from '../../features/claims/queries.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function AppealPage() {
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const claim = useClaim(claim_id);
  const draft = useDraftAppeal(claim_id);
  const submit = useSubmitAppeal(claim_id);
  const [letter, setLetter] = useState('');
  const [citations, setCitations] = useState([]);

  useEffect(() => {
    // Auto-draft once on load (only if not already drafted).
    if (claim.data && !letter && !draft.isPending) {
      draft.mutate(undefined, {
        onSuccess: (data) => {
          setLetter(data.appeal_letter || '');
          setCitations(data.citations || []);
        },
        onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.data]);

  async function send() {
    try {
      await submit.mutateAsync({ appeal_letter: letter });
      toast('Appeal submitted.', 'success');
      navigate(`/claims/${claim_id}`);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  if (claim.isLoading) return <LoadingState />;
  if (claim.error) return <ErrorState error={claim.error} />;

  return (
    <div>
      <PageHeader
        title="Draft appeal"
        subtitle={`Claim ${claim.data.claim_number || claim_id.slice(0, 8)} · denied`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Appeal letter</h3>
          {draft.isPending && !letter ? (
            <LoadingState label="Drafting appeal…" />
          ) : (
            <textarea
              className="input min-h-[420px] font-mono text-xs"
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
            />
          )}
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={() => draft.mutate(undefined, {
              onSuccess: (data) => { setLetter(data.appeal_letter || ''); setCitations(data.citations || []); },
            })} disabled={draft.isPending}>
              {draft.isPending ? 'Re-drafting…' : 'Re-draft'}
            </Button>
            <Button onClick={send} disabled={submit.isPending || !letter}>
              {submit.isPending ? 'Submitting…' : 'Submit appeal'}
            </Button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Citations</h3>
          {!citations.length ? (
            <div className="text-sm text-slate-500">No citations yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {citations.map((c, i) => (
                <li key={i} className="border border-slate-200 rounded p-2">
                  <div className="font-medium">{c.source}</div>
                  <div className="text-slate-500 text-xs mt-1">{c.excerpt}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
