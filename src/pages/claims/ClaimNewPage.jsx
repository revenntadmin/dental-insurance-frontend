import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useToast } from '@/hooks/useToast';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { api, api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProcedureRow } from '@/components/ProcedureRow';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const empty_claim = {
  patient_id: '',
  provider_id: '',
  patient_insurance_id: '',
  service_date: '',
  pre_procedure_id: null,
  procedures: [{ cdt_code: '', tooth: '', surfaces: '', fee: '' }],
};

export function ClaimNewPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const toast = useToast();
  const [search] = useSearchParams();
  const pre_id = search.get('pre_procedure_id');
  const [draft, set_draft, clear_draft] = useLocalDraft(`claim-draft-${pid}`, empty_claim);

  const pre_query = useQuery({
    enabled: !!pid && !!pre_id,
    queryKey: ['practice', pid, 'pre_procedures', pre_id],
    queryFn: () => api.get(`/api/practice/${pid}/pre_procedures/${pre_id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (pre_query.data) {
      const pp = pre_query.data;
      set_draft((d) => ({
        ...d,
        patient_id: pp.patient_id,
        provider_id: pp.provider_id,
        patient_insurance_id: pp.patient_insurance_id,
        service_date: pp.service_date,
        pre_procedure_id: pp.id,
        procedures: pp.procedures || d.procedures,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pre_query.data]);

  const patients = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'patients', { limit: 100 }],
    queryFn: () => api.get(`/api/practice/${pid}/patients`, { params: { limit: 100 } }).then((r) => r.data),
  });
  const providers = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'providers', { active: true }],
    queryFn: () => api.get(`/api/practice/${pid}/providers`, { params: { active: true } }).then((r) => r.data),
  });

  const patient = useMemo(
    () => patients.data?.find((p) => p.id === draft.patient_id),
    [patients.data, draft.patient_id],
  );

  const create = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims`, draft).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Claim draft saved');
      clear_draft();
      navigate(`/p/${pid}/claims/${data.id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  function update_proc(idx, value) {
    set_draft((d) => ({ ...d, procedures: d.procedures.map((p, i) => (i === idx ? value : p)) }));
  }

  function add_proc() {
    set_draft((d) => ({ ...d, procedures: [...d.procedures, { cdt_code: '', tooth: '', surfaces: '', fee: '' }] }));
  }

  function remove_proc(idx) {
    set_draft((d) => ({ ...d, procedures: d.procedures.filter((_, i) => i !== idx) }));
  }

  return (
    <div>
      <PageHeader title="New claim" description="Draft a claim. You'll be able to validate before submitting." />
      {pre_query.isLoading && <LoadingSpinner />}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="patient_id">Patient</Label>
            <select
              id="patient_id"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={draft.patient_id}
              onChange={(e) => set_draft((d) => ({ ...d, patient_id: e.target.value }))}
            >
              <option value="">Select a patient…</option>
              {patients.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service_date">Service date</Label>
            <Input
              id="service_date"
              type="date"
              value={draft.service_date}
              onChange={(e) => set_draft((d) => ({ ...d, service_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="provider_id">Provider</Label>
            <select
              id="provider_id"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={draft.provider_id}
              onChange={(e) => set_draft((d) => ({ ...d, provider_id: e.target.value }))}
            >
              <option value="">Select a provider…</option>
              {(providers.data || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="patient_insurance_id">Primary insurance</Label>
            <select
              id="patient_insurance_id"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={draft.patient_insurance_id}
              onChange={(e) => set_draft((d) => ({ ...d, patient_insurance_id: e.target.value }))}
            >
              <option value="">Select insurance…</option>
              {(patient?.insurances || []).map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.payer_name} · {ins.member_id}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold">Procedures</h3>
        {draft.procedures.map((p, i) => (
          <ProcedureRow
            key={i}
            pid={pid}
            value={p}
            onChange={(v) => update_proc(i, v)}
            onRemove={() => remove_proc(i)}
          />
        ))}
        <Button type="button" variant="outline" onClick={add_proc}>
          Add procedure
        </Button>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(`/p/${pid}/claims`)}>
          Cancel
        </Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save draft'}
        </Button>
      </div>
    </div>
  );
}
