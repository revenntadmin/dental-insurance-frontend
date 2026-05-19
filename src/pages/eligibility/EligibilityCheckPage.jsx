import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_datetime, format_money } from '@/lib/formatters';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function EligibilityCheckPage() {
  const pid = useTenancyParam();
  const toast = useToast();
  const [patient_id, set_patient_id] = useState('');
  const [insurance_id, set_insurance_id] = useState('');
  const [result, set_result] = useState(null);

  const patients = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'patients', { limit: 100 }],
    queryFn: () => api.get(`/api/practice/${pid}/patients`, { params: { limit: 100 } }).then((r) => r.data),
  });

  const cached_eligibility = useQuery({
    enabled: !!pid && !!insurance_id,
    queryKey: ['practice', pid, 'eligibility', insurance_id],
    queryFn: () =>
      api.get(`/api/practice/${pid}/patient_insurances/${insurance_id}/eligibility`).then((r) => r.data),
  });

  useEffect(() => {
    if (cached_eligibility.data) {
      const age_ms = Date.now() - new Date(cached_eligibility.data.fetched_at).getTime();
      if (age_ms < SEVEN_DAYS_MS) {
        set_result({ ...cached_eligibility.data, reused: true });
      } else {
        set_result(null);
      }
    } else {
      set_result(null);
    }
  }, [cached_eligibility.data]);

  const selected = patients.data?.items?.find((p) => p.id === patient_id);

  function on_insurance_change(e) {
    set_insurance_id(e.target.value);
    set_result(null);
  }

  const check = useMutation({
    mutationFn: () =>
      api
        .post(`/api/practice/${pid}/eligibility/check`, {
          patient_id,
          patient_insurance_id: insurance_id,
          force_refresh: true,
        })
        .then((r) => r.data),
    onSuccess: (data) => set_result(data),
    onError: (e) => toast.error(api_error_message(e)),
  });

  const days_ago = result?.fetched_at
    ? Math.floor((Date.now() - new Date(result.fetched_at).getTime()) / (24 * 60 * 60 * 1000))
    : null;

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
              onChange={(e) => { set_patient_id(e.target.value); set_insurance_id(''); set_result(null); }}
            >
              <option value="">Select…</option>
              {patients.data?.map((p) => (
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
              onChange={on_insurance_change}
            >
              <option value="">Select…</option>
              {(selected?.insurances || []).map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.payer_name} · {ins.member_id}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {result?.reused && days_ago !== null && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <span>Coverage verified {days_ago === 0 ? 'today' : `${days_ago} day${days_ago !== 1 ? 's' : ''} ago`}</span>
          <Button size="sm" variant="outline" onClick={() => check.mutate()} disabled={check.isPending}>
            {check.isPending ? 'Checking…' : 'Re-check'}
          </Button>
        </div>
      )}

      {!result?.reused && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => check.mutate()} disabled={!patient_id || !insurance_id || check.isPending}>
            {check.isPending ? 'Checking…' : 'Check eligibility'}
          </Button>
        </div>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              Result
              {result.reused && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (cached — fetched {format_datetime(result.fetched_at)})
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
