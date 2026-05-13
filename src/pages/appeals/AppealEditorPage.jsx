import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, RefreshCw, Send } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useAppeal, useUpdateAppeal, useMarkSent, useLogOutcome } from '@/features/appeals/useAppeal';
import { useGenerateAppealDraft } from '@/features/appeals/useGenerateAppealDraft';
import { useToast } from '@/hooks/useToast';
import { api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function AppealEditorPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const toast = useToast();
  const { data, isLoading } = useAppeal(pid, id);
  const update = useUpdateAppeal(pid, id);
  const mark_sent = useMarkSent(pid, id);
  const log_outcome = useLogOutcome(pid, id);
  const regen = useGenerateAppealDraft(pid, data?.claim_id);

  const [letter, set_letter] = useState('');
  const [save_state, set_save_state] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (data?.final_letter != null) set_letter(data.final_letter);
  }, [data]);

  useEffect(() => {
    if (!data?.id) return;
    if (letter === data.final_letter) return;
    set_save_state('Saving…');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update.mutate(
        { final_letter: letter },
        {
          onSuccess: () => set_save_state('Saved'),
          onError: (e) => {
            set_save_state('');
            toast.error(api_error_message(e));
          },
        },
      );
    }, 5000);
    return () => timer.current && clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Appeal editor"
        description={`Claim ${data.claim_control_number || data.claim_id.slice(0, 8)} · ${data.patient_name}`}
        actions={
          <>
            <StatusBadge status={data.status} />
            <Button
              variant="outline"
              onClick={() =>
                regen.mutate(undefined, {
                  onSuccess: (r) => set_letter(r.draft_letter),
                  onError: (e) => toast.error(api_error_message(e)),
                })
              }
              disabled={regen.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate draft
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                mark_sent.mutate(undefined, {
                  onSuccess: () => toast.success('Marked as sent'),
                  onError: (e) => toast.error(api_error_message(e)),
                })
              }
            >
              <Send className="mr-2 h-4 w-4" /> Mark as sent
            </Button>
            <LogOutcomeDialog log_outcome={log_outcome} />
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 no-print">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claim summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Payer:</span> {data.payer_name}
            </p>
            <p>
              <span className="font-medium">Denial codes:</span> {(data.denial_codes || []).join(', ') || '—'}
            </p>
            <p>
              <span className="font-medium">Denied procedures:</span> {(data.denied_procedures || []).join(', ') || '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Appeal letter</CardTitle>
            <span className="text-xs text-muted-foreground">{save_state}</span>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={20}
              value={letter}
              onChange={(e) => set_letter(e.target.value)}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <div className="print-only print-letter">
        <pre className="whitespace-pre-wrap">{letter}</pre>
      </div>
    </div>
  );
}

function LogOutcomeDialog({ log_outcome }) {
  const [open, set_open] = useState(false);
  const [outcome, set_outcome] = useState('appeal_accepted');
  const [notes, set_notes] = useState('');
  const toast = useToast();

  function submit() {
    log_outcome.mutate(
      { outcome, notes },
      {
        onSuccess: () => {
          toast.success('Outcome logged');
          set_open(false);
        },
        onError: (e) => toast.error(api_error_message(e)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button variant="outline">Log outcome</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log appeal outcome</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="outcome">Outcome</Label>
            <select
              id="outcome"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={outcome}
              onChange={(e) => set_outcome(e.target.value)}
            >
              <option value="appeal_accepted">Accepted</option>
              <option value="appeal_denied">Denied</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => set_notes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => set_open(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={log_outcome.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
