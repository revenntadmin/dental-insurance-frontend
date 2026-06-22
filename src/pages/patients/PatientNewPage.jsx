import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2, AlertTriangle, ChevronRight, Loader2,
  User, Shield, ClipboardCheck,
} from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useDebounce } from '@/hooks/useDebounce';
import { useExtractDocument } from '@/features/patients/useExtractDocument';
import { useScanSession } from '@/features/patients/useScanSession';
import { useInsurancePlans } from '@/features/patients/useInsurancePlans';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { format_date } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfidenceField } from '@/components/ConfidenceField';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// ─── constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'demographics', label: 'Demographics', icon: User },
  { key: 'insurance',    label: 'Insurance',    icon: Shield },
  { key: 'review',       label: 'Review',       icon: ClipboardCheck },
];

const empty_demo = {
  first_name: '', last_name: '', date_of_birth: '',
  gender: '', phone: '', email: '',
  address_line_1: '', address_line_2: '', city: '', state: '', zip: '',
};

const empty_ins = {
  insurance_plan_id: '', payer_name: '', payer_id: '',
  subscriber_member_id: '', group_number: '', group_name: '',
  relationship_to_subscriber: 'self',
  subscriber_first_name: '', subscriber_last_name: '', subscriber_date_of_birth: '',
  effective_date: '', termination_date: '',
  insurance_type: 'primary',
};

// ─── Payer typeahead ──────────────────────────────────────────────────────────

function PayerTypeahead({ pid, value, on_select, error }) {
  const [q, set_q] = useState(value || '');
  const [open, set_open] = useState(false);
  const dq = useDebounce(q, 250);
  const { data: plans = [] } = useInsurancePlans(pid, dq.length >= 1 ? dq : '');
  const container = useRef(null);

  useEffect(() => {
    function handle_outside(e) {
      if (container.current && !container.current.contains(e.target)) set_open(false);
    }
    document.addEventListener('mousedown', handle_outside);
    return () => document.removeEventListener('mousedown', handle_outside);
  }, []);

  function handle_change(e) {
    const v = e.target.value;
    set_q(v);
    set_open(true);
    on_select({ insurance_plan_id: '', payer_name: v, payer_id: '' });
  }

  function pick(plan) {
    set_q(plan.payer_name);
    set_open(false);
    on_select({ insurance_plan_id: plan.id, payer_name: plan.payer_name, payer_id: plan.payer_id });
  }

  return (
    <div ref={container} className="relative space-y-1.5">
      <Label>
        Payer name <span className="text-red-500">*</span>
      </Label>
      <Input
        value={q}
        onChange={handle_change}
        onFocus={() => set_open(true)}
        placeholder="Search by payer name or ID…"
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
        autoComplete="off"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {open && (plans.length > 0 || dq.length >= 2) && (
        <div className="absolute z-50 mt-0.5 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => { e.preventDefault(); pick(p); }}
            >
              <span>{p.payer_name}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.payer_id}</span>
            </button>
          ))}
          {dq.length >= 2 && plans.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No payers found. Enter payer ID below.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  done  && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-background text-primary',
                  !done && !active && 'border-muted-foreground/30 bg-background text-muted-foreground',
                )}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              <span className={cn('mt-1.5 text-xs', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-3 mb-5 h-0.5 flex-1', i < step ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Demographics form ────────────────────────────────────────────────────────

function DemoForm({ demo, confidences, on_change, errors, on_clear_error }) {
  function field(name, label, extra = {}) {
    return (
      <div className="space-y-1">
        <ConfidenceField
          required={['first_name', 'last_name', 'date_of_birth'].includes(name)}
          label={label}
          name={name}
          value={demo[name]}
          confidence={confidences[name]}
          onChange={(v) => { on_change(name, v); if (v.trim()) on_clear_error?.(name); }}
          className={errors[name] ? 'border-red-500 focus-visible:ring-red-500' : ''}
          {...extra}
        />
        {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {field('first_name', 'First name')}
      {field('last_name', 'Last name')}
      {field('date_of_birth', 'Date of birth', { type: 'date' })}
      <div className="space-y-1.5">
        <Label htmlFor="gender">Sex / gender</Label>
        <select
          id="gender"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={demo.gender}
          onChange={(e) => on_change('gender', e.target.value)}
        >
          <option value="">Select…</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="X">Non-binary / Other</option>
          <option value="U">Prefer not to say</option>
        </select>
      </div>
      {field('phone', 'Phone')}
      {field('email', 'Email')}
      {field('address_line_1', 'Address line 1')}
      {field('address_line_2', 'Address line 2')}
      <div className="grid grid-cols-3 gap-2">
        {field('city', 'City')}
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            maxLength={2}
            placeholder="CA"
            value={demo.state}
            onChange={(e) => on_change('state', e.target.value.toUpperCase())}
          />
        </div>
        {field('zip', 'Zip')}
      </div>
    </div>
  );
}

// ─── Insurance form ───────────────────────────────────────────────────────────

function InsuranceForm({ pid, ins, confidences, on_change, on_payer_select, errors, on_clear_error }) {
  const not_self = ins.relationship_to_subscriber !== 'self';

  function field(name, label, extra = {}) {
    return (
      <div className="space-y-1">
        <ConfidenceField
          required={name === 'subscriber_member_id'}
          label={label}
          name={name}
          value={ins[name]}
          confidence={confidences[name]}
          onChange={(v) => { on_change(name, v); if (v.trim()) on_clear_error?.(name); }}
          className={errors[name] ? 'border-red-500 focus-visible:ring-red-500' : ''}
          {...extra}
        />
        {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <PayerTypeahead
            pid={pid}
            value={ins.payer_name}
            on_select={on_payer_select}
            error={errors.payer_name}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payer_id">Payer ID</Label>
          <Input
            id="payer_id"
            placeholder="5-digit clearinghouse ID"
            value={ins.payer_id}
            onChange={(e) => on_change('payer_id', e.target.value)}
          />
        </div>
        {field('subscriber_member_id', 'Member ID')}
        {field('group_number', 'Group number')}
        {field('group_name', 'Group name')}
        <div className="space-y-1.5">
          <Label htmlFor="relationship">Relationship to subscriber <span className="text-red-500">*</span></Label>
          <select
            id="relationship"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={ins.relationship_to_subscriber}
            onChange={(e) => on_change('relationship_to_subscriber', e.target.value)}
          >
            <option value="self">Self</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="other">Other</option>
          </select>
        </div>
        {field('effective_date', 'Effective date', { type: 'date' })}
        {field('termination_date', 'Termination date', { type: 'date' })}
      </div>

      {not_self && (
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">Subscriber details</p>
          <div className="grid grid-cols-2 gap-4">
            {field('subscriber_first_name', 'Subscriber first name')}
            {field('subscriber_last_name', 'Subscriber last name')}
            {field('subscriber_date_of_birth', 'Subscriber DOB', { type: 'date' })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload tab (PDF scan) ────────────────────────────────────────────────────

function UploadTab({ pid, doc_type, on_extracted }) {
  const [extracted, set_extracted] = useState(false);
  const [preview, set_preview] = useState(null);
  const extract = useExtractDocument(pid);

  function on_pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    set_preview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    set_extracted(false);
    extract.mutate(
      { file: f, document_type: doc_type },
      { onSuccess: (data) => { on_extracted(data); set_extracted(true); } },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload a document or photo and the fields will be pre-filled automatically.
      </p>
      <div className="flex items-center gap-3">
        <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={on_pick} />
        {extract.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {extract.isPending && (
        <p className="text-sm text-muted-foreground">Extracting information from document…</p>
      )}
      {extracted && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Information extracted. Review the fields below before continuing.
        </div>
      )}
      {preview && <img src={preview} alt="Document preview" className="max-h-48 rounded border object-contain" />}
    </div>
  );
}

// ─── QR scan tab ─────────────────────────────────────────────────────────────

function QRTab({ pid, scan_type, on_extracted }) {
  const scan = useScanSession(pid, scan_type);

  useEffect(() => {
    if (scan.status === 'completed' && scan.extracted) {
      on_extracted(scan.extracted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.status]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generate a QR code, have the patient scan it on their phone and capture the document.
          The form will fill in automatically.
        </p>
        {!scan.session && (
          <Button onClick={() => scan.create_session()} disabled={scan.creating}>
            {scan.creating ? 'Generating…' : 'Generate QR code'}
          </Button>
        )}
        {scan.session && (
          <div className="space-y-3">
            <div className="inline-block rounded-lg border bg-white p-4">
              <QRCodeSVG value={scan.session.qr_url} size={180} />
            </div>
            <div className="text-sm">
              {scan.status === 'pending' && (
                <span className="inline-flex items-center text-muted-foreground" aria-live="polite">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for patient…
                </span>
              )}
              {scan.status === 'completed' && (
                <span className="text-green-700 font-medium">Captured successfully</span>
              )}
              {scan.status === 'expired' && (
                <div className="flex items-center gap-2 text-red-700">
                  Link expired.
                  <Button size="sm" variant="outline" onClick={() => scan.create_session()}>
                    Generate new
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How it works</p>
        <p className="mt-1">
          The QR code links to a one-time capture page. Once the patient submits a photo or document,
          the link expires and the fields auto-fill here.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PatientNewPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, set_step] = useState(0);
  const [created_patient_id, set_created_patient_id] = useState(null);
  const [created_insurance_id, set_created_insurance_id] = useState(null);

  // Step 1 — Demographics
  const [demo, set_demo] = useState(empty_demo);
  const [demo_conf, set_demo_conf] = useState({});
  const [demo_errors, set_demo_errors] = useState({});
  const [duplicate_matches, set_duplicate_matches] = useState(null);
  const [show_dup_dialog, set_show_dup_dialog] = useState(false);

  // Step 2 — Insurance
  const [ins_status, set_ins_status] = useState('has_insurance');
  const [ins, set_ins] = useState(empty_ins);
  const [ins_conf, set_ins_conf] = useState({});
  const [ins_errors, set_ins_errors] = useState({});
  const [show_name_mismatch, set_show_name_mismatch] = useState(false);
  const [eligibility_result, set_eligibility_result] = useState(null);
  const [eligibility_error, set_eligibility_error] = useState(null);

  // Duplicate check (debounced)
  const dup_query_enabled =
    !!demo.first_name.trim() && !!demo.last_name.trim() && !!demo.date_of_birth;
  const dup_q = useDebounce(
    { first_name: demo.first_name.trim(), last_name: demo.last_name.trim(), date_of_birth: demo.date_of_birth },
    600,
  );
  const dup_check = useQuery({
    enabled: dup_query_enabled,
    queryKey: ['practice', pid, 'patients', 'check_duplicate', dup_q],
    queryFn: () =>
      api
        .get(`/api/practice/${pid}/patients/check_duplicate`, { params: dup_q })
        .then((r) => r.data),
  });

  // ── Mutations ──
  const save_patient = useMutation({
    mutationFn: (data) =>
      api.post(`/api/practice/${pid}/patients`, data).then((r) => r.data),
  });

  const save_insurance = useMutation({
    mutationFn: ({ patient_id, data }) =>
      api
        .post(`/api/practice/${pid}/patients/${patient_id}/insurances`, data)
        .then((r) => r.data),
  });

  const run_eligibility = useMutation({
    mutationFn: (patient_insurance_id) =>
      api
        .post(`/api/practice/${pid}/eligibility/check`, {
          patient_insurance_id,
          force: true,
        })
        .then((r) => r.data),
  });

  // ── Field updaters ──
  function update_demo(name, value) {
    set_demo((p) => ({ ...p, [name]: value }));
  }

  function apply_demo_extracted(payload) {
    const fields = payload?.extracted || payload || {};
    const conf = {};
    const next = { ...demo };
    for (const key of Object.keys(empty_demo)) {
      if (fields[key] != null) { next[key] = fields[key] ?? ''; conf[key] = fields[`${key}_confidence`] ?? null; }
    }
    set_demo(next);
    set_demo_conf(conf);
  }

  function update_ins(name, value) {
    set_ins((p) => ({ ...p, [name]: value }));
  }

  function apply_ins_extracted(payload) {
    const fields = payload?.extracted || payload || {};
    const conf = {};
    const next = { ...ins };
    for (const key of Object.keys(empty_ins)) {
      if (fields[key] != null) { next[key] = fields[key] ?? ''; conf[key] = fields[`${key}_confidence`] ?? null; }
    }
    if (fields.payer_name) next.payer_name = fields.payer_name;
    if (fields.payer_id)   next.payer_id   = fields.payer_id;
    set_ins(next);
    set_ins_conf(conf);
    check_name_mismatch(next);
  }

  function handle_payer_select({ insurance_plan_id, payer_name, payer_id }) {
    set_ins((p) => ({ ...p, insurance_plan_id: insurance_plan_id || '', payer_name, payer_id: payer_id || p.payer_id }));
  }

  function check_name_mismatch(current_ins = ins) {
    if (current_ins.relationship_to_subscriber !== 'self') { set_show_name_mismatch(false); return; }
    const sub_first = current_ins.subscriber_first_name?.trim().toLowerCase();
    const sub_last  = current_ins.subscriber_last_name?.trim().toLowerCase();
    if (!sub_first && !sub_last) { set_show_name_mismatch(false); return; }
    const mismatch =
      (sub_first && sub_first !== demo.first_name.trim().toLowerCase()) ||
      (sub_last  && sub_last  !== demo.last_name.trim().toLowerCase());
    set_show_name_mismatch(mismatch);
  }

  // ── Validation ──
  function validate_demo() {
    const next = {};
    if (!demo.first_name.trim())  next.first_name  = 'Required';
    if (!demo.last_name.trim())   next.last_name   = 'Required';
    if (!demo.date_of_birth)      next.date_of_birth = 'Required';
    else if (demo.date_of_birth > new Date().toISOString().slice(0, 10))
      next.date_of_birth = 'Date of birth cannot be in the future';
    set_demo_errors(next);
    return !Object.keys(next).length;
  }

  function validate_ins() {
    if (ins_status !== 'has_insurance') return true;
    const next = {};
    if (!ins.payer_name.trim())           next.payer_name           = 'Required';
    if (!ins.subscriber_member_id.trim()) next.subscriber_member_id = 'Required';
    if (ins.effective_date && ins.termination_date && ins.termination_date < ins.effective_date)
      next.termination_date = 'End date must be after start date';
    set_ins_errors(next);
    return !Object.keys(next).length;
  }

  // ── Step navigation ──
  function handle_next_demo() {
    if (!validate_demo()) return;
    const matches = dup_check.data ?? [];
    if (matches.length > 0) {
      set_duplicate_matches(matches);
      set_show_dup_dialog(true);
      return;
    }
    set_step(1);
  }

  function proceed_to_insurance() {
    set_show_dup_dialog(false);
    set_step(1);
  }

  function handle_next_ins() {
    if (!validate_ins()) return;
    set_step(2);
  }

  // ── Eligibility check during wizard ──
  async function handle_check_eligibility() {
    if (!validate_demo() || !validate_ins()) return;
    set_eligibility_error(null);
    try {
      let patient_id = created_patient_id;
      if (!patient_id) {
        const p = await save_patient.mutateAsync(demo);
        patient_id = p.id;
        set_created_patient_id(patient_id);
      }
      // Reuse existing insurance record if already saved
      let insurance_id = created_insurance_id;
      if (!insurance_id) {
        const ins_data = { ...ins, insurance_plan_id: ins.insurance_plan_id || undefined };
        const saved_ins = await save_insurance.mutateAsync({ patient_id, data: ins_data });
        insurance_id = saved_ins.id;
        set_created_insurance_id(insurance_id);
      }
      const result = await run_eligibility.mutateAsync(insurance_id);
      set_eligibility_result(result);
    } catch (e) {
      set_eligibility_error(api_error_message(e));
    }
  }

  // ── Final save ──
  const is_saving = save_patient.isPending || save_insurance.isPending;

  async function handle_save() {
    try {
      let patient_id = created_patient_id;
      if (!patient_id) {
        const p = await save_patient.mutateAsync(demo);
        patient_id = p.id;
      }
      if (ins_status === 'has_insurance' && !created_insurance_id) {
        const ins_data = { ...ins, insurance_plan_id: ins.insurance_plan_id || undefined };
        await save_insurance.mutateAsync({ patient_id, data: ins_data });
      }
      toast.success('Patient saved');
      navigate(`/p/${pid}/patients/${patient_id}`);
    } catch (e) {
      toast.error(api_error_message(e));
    }
  }

  const is_checking = run_eligibility.isPending || save_patient.isPending || save_insurance.isPending;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New patient"
        description="Add a patient manually, from a document, or via QR scan."
      />

      <StepIndicator step={step} />

      {/* ── Step 1: Demographics ── */}
      {step === 0 && (
        <div className="space-y-4">
          {dup_check.data?.length > 0 && !show_dup_dialog && (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                A patient with this name and date of birth may already exist.{' '}
                <button
                  className="font-medium underline"
                  onClick={() => { set_duplicate_matches(dup_check.data); set_show_dup_dialog(true); }}
                >
                  Review match
                </button>
              </span>
            </div>
          )}
          <Tabs defaultValue="manual">
            <TabsList>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="upload">Upload document</TabsTrigger>
              <TabsTrigger value="scan">QR scan</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <Card><CardContent className="p-6">
                <DemoForm
                  demo={demo}
                  confidences={demo_conf}
                  on_change={update_demo}
                  errors={demo_errors}
                  on_clear_error={(f) => set_demo_errors((e) => ({ ...e, [f]: undefined }))}
                />
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="upload">
              <Card><CardContent className="p-6 space-y-6">
                <UploadTab pid={pid} doc_type="patient_intake" on_extracted={apply_demo_extracted} />
                <DemoForm
                  demo={demo}
                  confidences={demo_conf}
                  on_change={update_demo}
                  errors={demo_errors}
                  on_clear_error={(f) => set_demo_errors((e) => ({ ...e, [f]: undefined }))}
                />
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="scan">
              <Card><CardContent className="p-6 space-y-6">
                <QRTab pid={pid} scan_type="patient_info" on_extracted={apply_demo_extracted} />
                <DemoForm
                  demo={demo}
                  confidences={demo_conf}
                  on_change={update_demo}
                  errors={demo_errors}
                  on_clear_error={(f) => set_demo_errors((e) => ({ ...e, [f]: undefined }))}
                />
              </CardContent></Card>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end">
            <Button onClick={handle_next_demo}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Insurance ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Insurance status selector */}
          <Card><CardContent className="p-6">
            <p className="mb-3 text-sm font-medium">Does this patient have insurance?</p>
            <div className="flex gap-3">
              {[
                { v: 'has_insurance', label: 'Has insurance' },
                { v: 'no_insurance',  label: 'No insurance / Self-pay' },
                { v: 'unknown',       label: 'Unknown' },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set_ins_status(v)}
                  className={cn(
                    'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    ins_status === v
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent></Card>

          {ins_status === 'has_insurance' && (
            <>
              {show_name_mismatch && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  The subscriber name on the insurance card does not match the patient name.
                  Please review the fields before continuing.
                </div>
              )}

              <Tabs defaultValue="manual">
                <TabsList>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="upload">Upload card</TabsTrigger>
                  <TabsTrigger value="scan">QR scan</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <Card><CardContent className="p-6">
                    <InsuranceForm
                      pid={pid}
                      ins={ins}
                      confidences={ins_conf}
                      on_change={update_ins}
                      on_payer_select={handle_payer_select}
                      errors={ins_errors}
                      on_clear_error={(f) => set_ins_errors((e) => ({ ...e, [f]: undefined }))}
                    />
                  </CardContent></Card>
                </TabsContent>
                <TabsContent value="upload">
                  <Card><CardContent className="p-6 space-y-6">
                    <UploadTab pid={pid} doc_type="insurance_card" on_extracted={apply_ins_extracted} />
                    <InsuranceForm
                      pid={pid}
                      ins={ins}
                      confidences={ins_conf}
                      on_change={update_ins}
                      on_payer_select={handle_payer_select}
                      errors={ins_errors}
                      on_clear_error={(f) => set_ins_errors((e) => ({ ...e, [f]: undefined }))}
                    />
                  </CardContent></Card>
                </TabsContent>
                <TabsContent value="scan">
                  <Card><CardContent className="p-6 space-y-6">
                    <QRTab pid={pid} scan_type="insurance_card" on_extracted={apply_ins_extracted} />
                    <InsuranceForm
                      pid={pid}
                      ins={ins}
                      confidences={ins_conf}
                      on_change={update_ins}
                      on_payer_select={handle_payer_select}
                      errors={ins_errors}
                      on_clear_error={(f) => set_ins_errors((e) => ({ ...e, [f]: undefined }))}
                    />
                  </CardContent></Card>
                </TabsContent>
              </Tabs>

              {/* Eligibility check section */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Eligibility check</p>
                      <p className="text-xs text-muted-foreground">
                        Verify coverage with the payer. This has a cost — confirm insurance info before running.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={is_checking || !ins.payer_name || !ins.subscriber_member_id}
                      onClick={handle_check_eligibility}
                    >
                      {is_checking ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</>
                      ) : 'Run eligibility check'}
                    </Button>
                  </div>
                  {eligibility_error && (
                    <p className="mt-2 text-xs text-destructive">{eligibility_error}</p>
                  )}
                  {eligibility_result && (
                    <div className={cn(
                      'mt-3 rounded-md border p-3 text-sm',
                      eligibility_result.coverage_active
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-red-200 bg-red-50 text-red-800',
                    )}>
                      <p className="font-medium">
                        Coverage: {eligibility_result.coverage_active ? 'Active' : 'Inactive'}
                      </p>
                      {eligibility_result.plan_name && (
                        <p className="mt-0.5 text-xs">{eligibility_result.plan_name}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => set_step(0)}>Back</Button>
            <Button onClick={handle_next_ins}>
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Demographics</h3>
                <Button size="sm" variant="ghost" onClick={() => set_step(0)}>Edit</Button>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <ReviewField label="First name"   value={demo.first_name} />
                <ReviewField label="Last name"    value={demo.last_name} />
                <ReviewField label="Date of birth" value={format_date(demo.date_of_birth)} />
                <ReviewField label="Sex"           value={demo.gender || '—'} />
                <ReviewField label="Phone"         value={demo.phone || '—'} />
                <ReviewField label="Email"         value={demo.email || '—'} />
                {demo.address_line_1 && (
                  <div className="col-span-2">
                    <ReviewField label="Address" value={[demo.address_line_1, demo.city, demo.state, demo.zip].filter(Boolean).join(', ')} />
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Insurance</h3>
                <Button size="sm" variant="ghost" onClick={() => set_step(1)}>Edit</Button>
              </div>
              {ins_status === 'has_insurance' ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <ReviewField label="Payer"     value={ins.payer_name || '—'} />
                  <ReviewField label="Payer ID"  value={ins.payer_id   || '—'} />
                  <ReviewField label="Member ID" value={ins.subscriber_member_id || '—'} />
                  <ReviewField label="Group"     value={ins.group_number || '—'} />
                  <ReviewField label="Relationship" value={ins.relationship_to_subscriber} />
                  <ReviewField label="Effective" value={format_date(ins.effective_date)} />
                  {eligibility_result && (
                    <div className="col-span-2">
                      <ReviewField
                        label="Eligibility"
                        value={eligibility_result.coverage_active ? 'Active coverage confirmed' : 'Inactive coverage'}
                      />
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ins_status === 'no_insurance' ? 'No insurance / Self-pay' : 'Insurance status unknown'}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => set_step(1)}>Back</Button>
            <Button
              disabled={is_saving}
              onClick={handle_save}
            >
              {is_saving ? 'Saving…' : 'Save patient'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Duplicate warning dialog ── */}
      <Dialog open={show_dup_dialog} onOpenChange={(o) => !o && set_show_dup_dialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Possible duplicate patient
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A patient with the same name and date of birth already exists in this practice.
          </p>
          <div className="space-y-2">
            {(duplicate_matches ?? []).map((m) => (
              <div key={m.id} className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{m.first_name} {m.last_name}</p>
                <p className="text-xs text-muted-foreground">DOB: {format_date(m.date_of_birth)} · {m.phone || m.email || ''}</p>
                <Link
                  to={`/p/${pid}/patients/${m.id}`}
                  className="mt-1 text-xs text-primary hover:underline"
                  target="_blank"
                >
                  View patient record →
                </Link>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={proceed_to_insurance} className="flex-1">
              Continue creating new patient
            </Button>
            <Button variant="ghost" onClick={() => set_show_dup_dialog(false)} className="flex-1">
              Go back and edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewField({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || '—'}</dd>
    </div>
  );
}
