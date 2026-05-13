import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useClaim } from '@/features/claims/useClaim';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProcedureRow } from '@/components/ProcedureRow';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ClaimEditPage() {
  const pid = useTenancyParam();
  const { claim_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading } = useClaim(pid, claim_id);
  const [form, set_form] = useState(null);
  const [delete_open, set_delete_open] = useState(false);

  useEffect(() => {
    if (data) set_form(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put(`/api/practice/${pid}/claims/${claim_id}`, form).then((r) => r.data),
    onSuccess: () => {
      toast.success('Claim updated');
      navigate(`/p/${pid}/claims/${claim_id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const delete_claim = useMutation({
    mutationFn: () => api.delete(`/api/practice/${pid}/claims/${claim_id}`).then((r) => r.data),
    onSuccess: () => navigate(`/p/${pid}/claims`),
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (isLoading || !form) return <LoadingSpinner />;

  if (form.status !== 'draft') {
    return (
      <div>
        <PageHeader title="Editing not allowed" />
        <p className="text-sm text-muted-foreground">Only drafts can be edited.</p>
      </div>
    );
  }

  function update_proc(i, v) {
    set_form((f) => ({ ...f, procedures: f.procedures.map((p, idx) => (idx === i ? v : p)) }));
  }
  function add_proc() {
    set_form((f) => ({ ...f, procedures: [...(f.procedures || []), { cdt_code: '', tooth: '', surfaces: '', fee: '' }] }));
  }
  function remove_proc(i) {
    set_form((f) => ({ ...f, procedures: f.procedures.filter((_, idx) => idx !== i) }));
  }

  return (
    <div>
      <PageHeader title="Edit claim" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="service_date">Service date</Label>
            <Input
              id="service_date"
              type="date"
              value={form.service_date || ''}
              onChange={(e) => set_form((f) => ({ ...f, service_date: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold">Procedures</h3>
        {form.procedures.map((p, i) => (
          <ProcedureRow key={i} pid={pid} value={p} onChange={(v) => update_proc(i, v)} onRemove={() => remove_proc(i)} />
        ))}
        <Button variant="outline" onClick={add_proc}>
          Add procedure
        </Button>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="destructive" onClick={() => set_delete_open(true)}>
          Delete claim
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

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
