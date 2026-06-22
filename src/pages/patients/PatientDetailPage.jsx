import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  Pencil, PlusCircle, Shield, ShieldOff, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, Upload,
} from 'lucide-react';
import { differenceInYears, parseISO, isValid } from 'date-fns';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePatient } from '@/features/patients/usePatient';
import { useExtractDocument } from '@/features/patients/useExtractDocument';
import { useScanSession } from '@/features/patients/useScanSession';
import { useInsurancePlans } from '@/features/patients/useInsurancePlans';
import { useDebounce } from '@/hooks/useDebounce';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { format_date, format_datetime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfidenceField } from '@/components/ConfidenceField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';

// ─── helpers ──────────────────────────────────────────────────────────────────

function calc_age(dob) {
  if (!dob) return null;
  const d = parseISO(dob);
  return isValid(d) ? differenceInYears(new Date(), d) : null;
}

function CoverageBadge({ active }) {
  if (active === true)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  if (active === false)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Inactive
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Not verified
    </span>
  );
}

function DeductibleBar({ met, annual }) {
  if (!annual) return null;
  const pct = Math.min(100, Math.round((Number(met) / Number(annual)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Deductible met</span>
        <span>${Number(met ?? 0).toFixed(0)} / ${Number(annual).toFixed(0)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

function DemoField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || '—'}</p>
    </div>
  );
}

// ─── Payer typeahead (same as in NewPage) ────────────────────────────────────

function PayerTypeahead({ pid, value, on_select }) {
  const [q, set_q] = useState(value || '');
  const [open, set_open] = useState(false);
  const dq = useDebounce(q, 250);
  const { data: plans = [] } = useInsurancePlans(pid, dq.length >= 1 ? dq : '');

  return (
    <div className="relative space-y-1.5">
      <Label>Payer name <span className="text-red-500">*</span></Label>
      <Input
        value={q}
        onChange={(e) => { set_q(e.target.value); set_open(true); on_select({ insurance_plan_id: '', payer_name: e.target.value, payer_id: '' }); }}
        onFocus={() => set_open(true)}
        onBlur={() => setTimeout(() => set_open(false), 150)}
        placeholder="Search payer name…"
        autoComplete="off"
      />
      {open && plans.length > 0 && (
        <div className="absolute z-50 mt-0.5 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={() => { on_select({ insurance_plan_id: p.id, payer_name: p.payer_name, payer_id: p.payer_id }); set_q(p.payer_name); set_open(false); }}
            >
              <span>{p.payer_name}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.payer_id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Insurance modal (add / edit) ─────────────────────────────────────────────

function InsuranceModal({ pid, patient_id, initial, mode, on_close, on_saved }) {
  const toast = useToast();
  const qc = useQueryClient();
  const is_edit = mode === 'edit';

  const [form, set_form] = useState(initial || {
    insurance_plan_id: '', payer_name: '', payer_id: '',
    subscriber_member_id: '', group_number: '', group_name: '',
    relationship_to_subscriber: 'self',
    subscriber_first_name: '', subscriber_last_name: '', subscriber_date_of_birth: '',
    effective_date: '', termination_date: '',
    insurance_type: 'primary',
  });
  const [form_conf, set_form_conf] = useState({});
  const [errors, set_errors] = useState({});
  const [ins_tab, set_ins_tab] = useState('manual');

  const extract = useExtractDocument(pid);
  const scan = useScanSession(pid, 'insurance_card');

  useEffect(() => {
    if (scan.status === 'completed' && scan.extracted) {
      apply_extracted(scan.extracted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.status]);

  function update(name, value) { set_form((p) => ({ ...p, [name]: value })); }

  function apply_extracted(payload) {
    const fields = payload?.extracted || payload || {};
    const conf = {};
    const next = { ...form };
    const allowed = ['subscriber_member_id','group_number','group_name','subscriber_first_name',
      'subscriber_last_name','subscriber_date_of_birth','effective_date','termination_date','payer_name','payer_id'];
    for (const k of allowed) {
      if (fields[k] != null) { next[k] = fields[k]; conf[k] = fields[`${k}_confidence`] ?? null; }
    }
    if (fields.payer_name && !next.insurance_plan_id) next.payer_name = fields.payer_name;
    set_form(next);
    set_form_conf(conf);
  }

  function validate() {
    const next = {};
    if (!form.payer_name?.trim())           next.payer_name = 'Required';
    if (!form.subscriber_member_id?.trim()) next.subscriber_member_id = 'Required';
    set_errors(next);
    return !Object.keys(next).length;
  }

  const save_mut = useMutation({
    mutationFn: () => {
      const body = { ...form };
      if (!body.insurance_plan_id) delete body.insurance_plan_id;
      if (is_edit) return api.put(`/api/practice/${pid}/patient_insurances/${initial.id}`, body).then((r) => r.data);
      return api.post(`/api/practice/${pid}/patients/${patient_id}/insurances`, body).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id] });
      toast.success(is_edit ? 'Insurance updated' : 'Insurance added');
      on_saved?.();
      on_close();
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  function handle_payer_select({ insurance_plan_id, payer_name, payer_id }) {
    set_form((p) => ({ ...p, insurance_plan_id: insurance_plan_id || '', payer_name, payer_id: payer_id || p.payer_id }));
  }

  function field(name, label, extra = {}) {
    return (
      <div className="space-y-1">
        <ConfidenceField
          required={name === 'subscriber_member_id'}
          label={label}
          name={name}
          value={form[name] ?? ''}
          confidence={form_conf[name]}
          onChange={(v) => { update(name, v); if (errors[name]) set_errors((e) => ({ ...e, [name]: undefined })); }}
          {...extra}
        />
        {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && on_close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{is_edit ? 'Edit insurance' : 'Add insurance'}</DialogTitle>
        </DialogHeader>

        <Tabs value={ins_tab} onValueChange={set_ins_tab}>
          <TabsList>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="upload">Upload card</TabsTrigger>
            <TabsTrigger value="scan">QR scan</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  extract.mutate(
                    { file: f, document_type: 'insurance_card' },
                    { onSuccess: apply_extracted },
                  );
                }}
              />
              {extract.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {extract.isPending && <p className="text-sm text-muted-foreground">Extracting…</p>}
          </TabsContent>

          <TabsContent value="scan">
            {!scan.session ? (
              <Button size="sm" onClick={() => scan.create_session()} disabled={scan.creating}>
                {scan.creating ? 'Generating…' : 'Generate QR code'}
              </Button>
            ) : (
              <div className="flex items-start gap-4">
                <div className="rounded border bg-white p-3">
                  <QRCodeSVG value={scan.session.qr_url} size={140} />
                </div>
                <div className="text-sm">
                  {scan.status === 'pending' && (
                    <span className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for scan…
                    </span>
                  )}
                  {scan.status === 'completed' && <span className="text-green-700">Captured!</span>}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="col-span-2 md:col-span-1">
            <PayerTypeahead pid={pid} value={form.payer_name} on_select={handle_payer_select} />
            {errors.payer_name && <p className="mt-1 text-xs text-red-500">{errors.payer_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Payer ID</Label>
            <Input value={form.payer_id ?? ''} onChange={(e) => update('payer_id', e.target.value)} />
          </div>
          {field('subscriber_member_id', 'Member ID')}
          {field('group_number', 'Group number')}
          {field('group_name', 'Group name')}
          <div className="space-y-1.5">
            <Label>Insurance type</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.insurance_type}
              onChange={(e) => update('insurance_type', e.target.value)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Relationship to subscriber</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.relationship_to_subscriber}
              onChange={(e) => update('relationship_to_subscriber', e.target.value)}
            >
              <option value="self">Self</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="other">Other</option>
            </select>
          </div>
          {form.relationship_to_subscriber !== 'self' && (
            <>
              {field('subscriber_first_name', 'Subscriber first name')}
              {field('subscriber_last_name', 'Subscriber last name')}
              {field('subscriber_date_of_birth', 'Subscriber DOB', { type: 'date' })}
            </>
          )}
          {field('effective_date', 'Effective date', { type: 'date' })}
          {field('termination_date', 'Termination date', { type: 'date' })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={on_close}>Cancel</Button>
          <Button
            disabled={save_mut.isPending}
            onClick={() => validate() && save_mut.mutate()}
          >
            {save_mut.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Eligibility check card ───────────────────────────────────────────────────

function EligibilityCheckRow({ check }) {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-0 text-sm">
      {check.coverage_active === true
        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        : check.coverage_active === false
        ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="flex-1">
        <p className="font-medium">
          {check.coverage_active === true ? 'Active coverage confirmed'
            : check.coverage_active === false ? 'Coverage inactive'
            : 'Check result unknown'}
        </p>
        {check.plan_name && <p className="text-xs text-muted-foreground">{check.plan_name}</p>}
      </div>
      <span className="text-xs text-muted-foreground">{format_datetime(check.checked_at)}</span>
    </div>
  );
}

// ─── Activity log entry ───────────────────────────────────────────────────────

const ACTION_LABELS = {
  'patient.create':            'Patient record created',
  'patient.update':            'Demographics updated',
  'patient.deactivate':        'Patient deactivated',
  'patient_insurance.add':     'Insurance added',
  'patient_insurance.update':  'Insurance updated',
  'patient_insurance.deactivate': 'Insurance deactivated',
};

function ActivityEntry({ entry }) {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-0 text-sm">
      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50 mt-2" />
      <div className="flex-1">
        <p>{ACTION_LABELS[entry.action] || entry.action}</p>
        {entry.user_name && (
          <p className="text-xs text-muted-foreground">by {entry.user_name}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{format_datetime(entry.created_at)}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PatientDetailPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: patient, isLoading } = usePatient(pid, patient_id);

  const [ins_modal, set_ins_modal] = useState(null); // null | 'add' | insurance-obj
  const [deactivate_ins, set_deactivate_ins] = useState(null);
  const [checking_ins_id, set_checking_ins_id] = useState(null);

  // Eligibility check (from sidebar or insurance card)
  const check_eligibility = useMutation({
    mutationFn: (patient_insurance_id) =>
      api.post(`/api/practice/${pid}/eligibility/check`, { patient_insurance_id, force: true }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id] });
      toast.success('Eligibility check complete');
      set_checking_ins_id(null);
    },
    onError: (e) => { toast.error(api_error_message(e)); set_checking_ins_id(null); },
  });

  function run_eligibility(ins_id) {
    set_checking_ins_id(ins_id);
    check_eligibility.mutate(ins_id);
  }

  // Deactivate insurance
  const deactivate_ins_mut = useMutation({
    mutationFn: (id) => api.delete(`/api/practice/${pid}/patient_insurances/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id] });
      set_deactivate_ins(null);
      toast.success('Insurance deactivated');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  // Claims (placeholder data fetch, won't break when implemented)
  const claims = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'claims', { patient_id }],
    queryFn: () => api.get(`/api/practice/${pid}/claims`, { params: { patient_id } }).then((r) => r.data),
  });

  // Activity log
  const activity = useQuery({
    enabled: !!pid && !!patient_id,
    queryKey: ['practice', pid, 'patients', patient_id, 'activity'],
    queryFn: () => api.get(`/api/practice/${pid}/patients/${patient_id}/activity`).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!patient) return <EmptyState title="Patient not found" />;

  const insurances = patient.patient_insurances ?? [];
  const primary_ins = insurances.find((i) => i.insurance_type === 'primary' && i.is_active);
  const age = calc_age(patient.date_of_birth);

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 space-y-4">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Status */}
          <div>
            {patient.is_active === false && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 mb-2">
                Inactive
              </span>
            )}
            <h2 className="text-lg font-semibold leading-tight">
              {patient.first_name} {patient.last_name}
            </h2>
            {age != null && (
              <p className="text-sm text-muted-foreground">
                {format_date(patient.date_of_birth)} · {age} y/o
              </p>
            )}
          </div>

          <div className="space-y-2.5 border-t pt-3">
            <SidebarField label="Phone" value={patient.phone} />
            <SidebarField label="Email" value={patient.email} />
            {patient.chart_number && <SidebarField label="Chart #" value={patient.chart_number} />}
          </div>

          {/* Quick actions */}
          <div className="border-t pt-3 space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/p/${pid}/patients/${patient_id}/edit`)}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit patient
            </Button>
            {primary_ins && (
              <Button
                className="w-full justify-start"
                variant="outline"
                size="sm"
                disabled={check_eligibility.isPending}
                onClick={() => run_eligibility(primary_ins.id)}
              >
                {checking_ins_id === primary_ins.id && check_eligibility.isPending
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Checking…</>
                  : <><Shield className="mr-2 h-3.5 w-3.5" /> Run eligibility check</>}
              </Button>
            )}
            <Button
              className="w-full justify-start opacity-50"
              variant="outline"
              size="sm"
              disabled
            >
              <FileText className="mr-2 h-3.5 w-3.5" /> New claim
              <span className="ml-auto text-xs text-muted-foreground">(coming soon)</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="activity">Activity log</TabsTrigger>
          </TabsList>

          {/* ── Overview tab ── */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Demographics</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/p/${pid}/patients/${patient_id}/edit`)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <DemoField label="First name"  value={patient.first_name} />
                <DemoField label="Last name"   value={patient.last_name} />
                <DemoField label="Date of birth" value={`${format_date(patient.date_of_birth)}${age != null ? ` (${age} y/o)` : ''}`} />
                <DemoField label="Sex"         value={patient.gender} />
                <DemoField label="Phone"       value={patient.phone} />
                <DemoField label="Email"       value={patient.email} />
                {patient.address_line_1 && (
                  <div className="col-span-2">
                    <DemoField
                      label="Address"
                      value={[patient.address_line_1, patient.address_line_2, patient.city, patient.state, patient.zip].filter(Boolean).join(', ')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance summary cards */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Insurance</h3>
                <Button size="sm" variant="outline" onClick={() => set_ins_modal('add')}>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  {insurances.length === 0 ? 'Add insurance' : 'Add secondary'}
                </Button>
              </div>
              {insurances.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No insurance on file.{' '}
                  <button className="text-primary hover:underline" onClick={() => set_ins_modal('add')}>
                    Add insurance
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {insurances.map((ins) => (
                    <InsuranceSummaryCard
                      key={ins.id}
                      ins={ins}
                      on_edit={() => set_ins_modal(ins)}
                      on_deactivate={() => set_deactivate_ins(ins)}
                      on_check_eligibility={() => run_eligibility(ins.id)}
                      is_checking={checking_ins_id === ins.id && check_eligibility.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Insurance tab ── */}
          <TabsContent value="insurance" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => set_ins_modal('add')}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add insurance
              </Button>
            </div>
            {insurances.length === 0 ? (
              <EmptyState title="No insurance on file" />
            ) : (
              insurances.map((ins) => (
                <InsuranceDetailCard
                  key={ins.id}
                  pid={pid}
                  ins={ins}
                  on_edit={() => set_ins_modal(ins)}
                  on_deactivate={() => set_deactivate_ins(ins)}
                  on_check_eligibility={() => run_eligibility(ins.id)}
                  is_checking={checking_ins_id === ins.id && check_eligibility.isPending}
                />
              ))
            )}
          </TabsContent>

          {/* ── Claims tab (placeholder) ── */}
          <TabsContent value="claims">
            <div className="rounded-lg border border-dashed p-12 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">Claims coming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Claim history for this patient will appear here once the claims module is enabled.
              </p>
            </div>
          </TabsContent>

          {/* ── Activity log tab ── */}
          <TabsContent value="activity">
            {activity.isLoading ? (
              <LoadingSpinner />
            ) : !activity.data?.length ? (
              <EmptyState title="No activity recorded yet" />
            ) : (
              <Card>
                <CardContent className="p-4">
                  {activity.data.map((entry) => (
                    <ActivityEntry key={entry.id} entry={entry} />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Insurance add/edit modal ── */}
      {ins_modal && (
        <InsuranceModal
          pid={pid}
          patient_id={patient_id}
          initial={ins_modal === 'add' ? null : ins_modal}
          mode={ins_modal === 'add' ? 'add' : 'edit'}
          on_close={() => set_ins_modal(null)}
        />
      )}

      {/* ── Deactivate insurance confirm ── */}
      <Dialog open={!!deactivate_ins} onOpenChange={(o) => !o && set_deactivate_ins(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate insurance?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will deactivate the <strong>{deactivate_ins?.payer_name}</strong> record.
            The history will be preserved.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => set_deactivate_ins(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deactivate_ins_mut.isPending}
              onClick={() => deactivate_ins_mut.mutate(deactivate_ins.id)}
            >
              {deactivate_ins_mut.isPending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Insurance summary card (Overview tab) ────────────────────────────────────

function InsuranceSummaryCard({ ins, on_edit, on_deactivate, on_check_eligibility, is_checking }) {
  return (
    <Card className={cn(!ins.is_active && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{ins.payer_name}</p>
              <span className="rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">{ins.insurance_type}</span>
            </div>
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">{ins.subscriber_member_id}</p>
          </div>
          <CoverageBadge active={ins.latest_coverage_active} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {ins.group_number && <><dt className="text-muted-foreground">Group</dt><dd>{ins.group_number}</dd></>}
          {ins.effective_date && <><dt className="text-muted-foreground">Effective</dt><dd>{format_date(ins.effective_date)}</dd></>}
          {ins.termination_date && <><dt className="text-muted-foreground">Ends</dt><dd>{format_date(ins.termination_date)}</dd></>}
        </dl>
        {ins.eligibility_checked_at && (
          <p className="mt-2 text-xs text-muted-foreground">
            Checked {format_date(ins.eligibility_checked_at)}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={on_edit}>Edit</Button>
          {ins.is_active && (
            <>
              <Button size="sm" variant="outline" disabled={is_checking} onClick={on_check_eligibility}>
                {is_checking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Checking…</> : 'Check eligibility'}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={on_deactivate}>
                Deactivate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Insurance detail card (Insurance tab) ────────────────────────────────────

function InsuranceDetailCard({ pid, ins, on_edit, on_deactivate, on_check_eligibility, is_checking }) {
  const { data: history = [] } = useQuery({
    enabled: !!pid && !!ins.id,
    queryKey: ['practice', pid, 'patient_insurances', ins.id, 'eligibility', 'history'],
    queryFn: () =>
      api.get(`/api/practice/${pid}/patient_insurances/${ins.id}/eligibility/history`).then((r) => r.data),
  });
  return (
    <Card className={cn(!ins.is_active && 'opacity-60')}>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{ins.payer_name}</CardTitle>
            <span className="rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">{ins.insurance_type}</span>
            {!ins.is_active && <span className="rounded-full border bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Inactive</span>}
          </div>
          <p className="mt-0.5 font-mono text-sm text-muted-foreground">{ins.subscriber_member_id}</p>
        </div>
        <CoverageBadge active={ins.latest_coverage_active} />
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <DemoField label="Payer ID"    value={ins.payer_id} />
          <DemoField label="Group #"     value={ins.group_number} />
          <DemoField label="Group name"  value={ins.group_name} />
          <DemoField label="Relationship" value={ins.relationship_to_subscriber} />
          <DemoField label="Effective"   value={format_date(ins.effective_date)} />
          <DemoField label="Terminates"  value={format_date(ins.termination_date)} />
          {ins.relationship_to_subscriber !== 'self' && (
            <>
              <DemoField label="Subscriber" value={`${ins.subscriber_first_name || ''} ${ins.subscriber_last_name || ''}`} />
              <DemoField label="Subscriber DOB" value={format_date(ins.subscriber_date_of_birth)} />
            </>
          )}
        </dl>

        {/* Deductible / benefit info from latest eligibility */}
        {(ins.deductible_annual || ins.out_of_pocket_max) && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Benefits</p>
            <DeductibleBar met={ins.deductible_met} annual={ins.deductible_annual} />
            {ins.out_of_pocket_max && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Out-of-pocket max</span>
                  <span>${Number(ins.out_of_pocket_met ?? 0).toFixed(0)} / ${Number(ins.out_of_pocket_max).toFixed(0)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{ width: `${Math.min(100, Math.round((Number(ins.out_of_pocket_met) / Number(ins.out_of_pocket_max)) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={on_edit}>Edit</Button>
          {ins.is_active && (
            <>
              <Button size="sm" variant="outline" disabled={is_checking} onClick={on_check_eligibility}>
                {is_checking
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Checking…</>
                  : <><Shield className="mr-1.5 h-3.5 w-3.5" /> Check eligibility</>}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={on_deactivate}>
                Deactivate
              </Button>
            </>
          )}
        </div>

        {/* Eligibility check history */}
        {history.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Eligibility history
            </p>
            <div className="rounded-md border">
              {history.map((c) => <EligibilityCheckRow key={c.id} check={c} />)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
