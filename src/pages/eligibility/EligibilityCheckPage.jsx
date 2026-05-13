import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_datetime, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function EligibilityCheckPage() {
  const pid = useTenancyParam();
  const toast = useToast();
  const [patient_id, set_patient_id] = useState('');
  const [insurance_id, set_insurance_id] = useState('');
  const [force, set_force] = useState(false);
  const [result, set_result] = useState(null);

  const patients = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'patients', { limit: 100 }],
    queryFn: () => api.get(`/api/practice/${pid}/patients`, { params: { limit: 100 } }).then((r) => r.data),
  });

  const selected = patients.data?.items?.find((p) => p.id === patient_id);

  const check = useMutation({
    mutationFn: () =>
      api
        .post(`/api/practice/${pid}/eligibility/check`, {
          patient_id,
          patient_insurance_id: insurance_id,
          force_refresh: force,
        })
        .then((r) => r.data),
    onSuccess: (data) => set_result(data),
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title="Eligibility check" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="patient">Patient</Label>
            <select
              id="patient"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={patient_id}
              onChange={(e) => set_patient_id(e.target.value)}
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
            <Label htmlFor="insurance">Insurance</Label>
            <select
              id="insurance"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={insurance_id}
              onChange={(e) => set_insurance_id(e.target.value)}
            >
              <option value="">Select…</option>
              {(selected?.insurances || []).map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.payer_name} · {ins.member_id}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={force} onChange={(e) => set_force(e.target.checked)} />
            Force re-check (skip cache)
          </label>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => check.mutate()} disabled={!patient_id || !insurance_id || check.isPending}>
          {check.isPending ? 'Checking…' : 'Check eligibility'}
        </Button>
      </div>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              Result
              {result.reused && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (reused — fetched {format_datetime(result.fetched_at)})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>Coverage active: {result.coverage_active ? 'Yes' : 'No'}</li>
              <li>Plan: {result.plan_name || '—'}</li>
              <li>Deductible: {format_money(result.deductible)}</li>
              <li>OOP max: {format_money(result.oop_max)}</li>
              <li>Fetched: {format_datetime(result.fetched_at)}</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
