import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useCreatePreProcedure } from '@/features/pre_procedure/usePreProcedure';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProcedureRow } from '@/components/ProcedureRow';

export function PreProcedureNewPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, set_form] = useState({
    patient_id: '',
    provider_id: '',
    patient_insurance_id: '',
    service_date: '',
    procedures: [{ cdt_code: '', tooth: '', surfaces: '', fee: '' }],
  });

  const patients = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'patients', { limit: 100 }],
    queryFn: () => api.get(`/api/practice/${pid}/patients`, { params: { limit: 100 } }).then((r) => r.data),
  });
  const patient = useMemo(() => patients.data?.items?.find((p) => p.id === form.patient_id), [patients.data, form.patient_id]);
  const create = useCreatePreProcedure(pid);

  function run() {
    create.mutate(form, {
      onSuccess: (data) => navigate(`/p/${pid}/pre-procedure/${data.id}`),
      onError: (e) => toast.error(api_error_message(e)),
    });
  }

  function update_proc(i, v) {
    set_form((f) => ({ ...f, procedures: f.procedures.map((p, idx) => (idx === i ? v : p)) }));
  }
  function add_proc() {
    set_form((f) => ({ ...f, procedures: [...f.procedures, { cdt_code: '', tooth: '', surfaces: '', fee: '' }] }));
  }
  function remove_proc(i) {
    set_form((f) => ({ ...f, procedures: f.procedures.filter((_, idx) => idx !== i) }));
  }

  return (
    <div>
      <PageHeader title="Pre-procedure check" description="Check coverage before scheduling work." />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="patient_id">Patient</Label>
            <select
              id="patient_id"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.patient_id}
              onChange={(e) => set_form((f) => ({ ...f, patient_id: e.target.value }))}
            >
              <option value="">Select…</option>
              {patients.data?.items?.map((p) => (
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
              value={form.service_date}
              onChange={(e) => set_form((f) => ({ ...f, service_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="provider_id">Provider</Label>
            <select
              id="provider_id"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.provider_id}
              onChange={(e) => set_form((f) => ({ ...f, provider_id: e.target.value }))}
            >
              <option value="">Select…</option>
              {(patient?.providers || []).map((p) => (
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
              value={form.patient_insurance_id}
              onChange={(e) => set_form((f) => ({ ...f, patient_insurance_id: e.target.value }))}
            >
              <option value="">Select…</option>
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
        {form.procedures.map((p, i) => (
          <ProcedureRow key={i} pid={pid} value={p} onChange={(v) => update_proc(i, v)} onRemove={() => remove_proc(i)} />
        ))}
        <Button variant="outline" onClick={add_proc}>
          Add procedure
        </Button>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={run} disabled={create.isPending}>
          {create.isPending ? 'Running…' : 'Run check'}
        </Button>
      </div>
    </div>
  );
}
