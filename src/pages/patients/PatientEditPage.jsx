import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePatient } from '@/features/patients/usePatient';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// ─── helpers ──────────────────────────────────────────────────────────────────

const DEMO_FIELDS = [
  { name: 'first_name',    label: 'First name',    required: true },
  { name: 'last_name',     label: 'Last name',     required: true },
  { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true },
  { name: 'gender',        label: 'Sex / gender',  widget: 'gender_select' },
  { name: 'phone',         label: 'Phone' },
  { name: 'email',         label: 'Email',         type: 'email' },
  { name: 'address_line_1', label: 'Address line 1' },
  { name: 'address_line_2', label: 'Address line 2' },
  { name: 'city',          label: 'City' },
  { name: 'state',         label: 'State',         maxLength: 2 },
  { name: 'zip',           label: 'Zip',           maxLength: 10 },
  { name: 'chart_number',  label: 'Chart number' },
];

function GenderSelect({ value, onChange }) {
  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select…</option>
      <option value="M">Male</option>
      <option value="F">Female</option>
      <option value="X">Non-binary / Other</option>
      <option value="U">Prefer not to say</option>
    </select>
  );
}

function FieldWrapper({ def, value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={def.name}>
        {def.label}
        {def.required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {def.widget === 'gender_select' ? (
        <GenderSelect value={value} onChange={onChange} />
      ) : (
        <Input
          id={def.name}
          type={def.type || 'text'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={def.maxLength}
          className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Unsaved-changes guard ────────────────────────────────────────────────────

function UnsavedChangesDialog({ blocker }) {
  if (!blocker || blocker.state !== 'blocked') return null;
  return (
    <Dialog open onOpenChange={() => blocker.reset()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You have unsaved changes. Leaving this page will discard them.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => blocker.reset()}>Stay</Button>
          <Button variant="destructive" onClick={() => blocker.proceed()}>Leave and discard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PatientEditPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = usePatient(pid, patient_id);

  const [form, set_form] = useState({});
  const [errors, set_errors] = useState({});
  const [dirty, set_dirty] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (data && !initialized.current) {
      set_form({
        first_name:    data.first_name    ?? '',
        last_name:     data.last_name     ?? '',
        date_of_birth: data.date_of_birth ?? '',
        gender:        data.gender        ?? '',
        phone:         data.phone         ?? '',
        email:         data.email         ?? '',
        address_line_1: data.address_line_1 ?? '',
        address_line_2: data.address_line_2 ?? '',
        city:          data.city          ?? '',
        state:         data.state         ?? '',
        zip:           data.zip           ?? '',
        chart_number:  data.chart_number  ?? '',
        notes:         data.notes         ?? '',
      });
      initialized.current = true;
    }
  }, [data]);

  const blocker = useBlocker(dirty);

  function update(name, value) {
    set_form((p) => ({ ...p, [name]: value }));
    set_dirty(true);
  }

  function validate() {
    const next = {};
    if (!form.first_name?.trim())  next.first_name  = 'Required';
    if (!form.last_name?.trim())   next.last_name   = 'Required';
    if (!form.date_of_birth)       next.date_of_birth = 'Required';
    else if (form.date_of_birth > new Date().toISOString().slice(0, 10))
      next.date_of_birth = 'Date of birth cannot be in the future';
    set_errors(next);
    return !Object.keys(next).length;
  }

  const save_mut = useMutation({
    mutationFn: () =>
      api.put(`/api/practice/${pid}/patients/${patient_id}`, form).then((r) => r.data),
    onSuccess: () => {
      set_dirty(false);
      qc.invalidateQueries({ queryKey: ['practice', pid, 'patients', patient_id] });
      toast.success('Patient updated');
      navigate(`/p/${pid}/patients/${patient_id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  function handle_save() {
    if (validate()) save_mut.mutate();
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Edit patient"
        description={data ? `${data.first_name} ${data.last_name}` : ''}
      />

      {/* Demographics section */}
      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {DEMO_FIELDS.map((def) => (
            <div key={def.name} className={def.name === 'address_line_1' || def.name === 'address_line_2' ? 'col-span-2' : ''}>
              <FieldWrapper
                def={def}
                value={form[def.name]}
                onChange={(v) => update(def.name, v)}
                error={errors[def.name]}
              />
            </div>
          ))}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance section — show existing, link to full management */}
      {data?.patient_insurances?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Insurance</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/p/${pid}/patients/${patient_id}`, { state: { tab: 'insurance' } })}
              >
                Manage insurance →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.patient_insurances.map((ins) => (
              <div key={ins.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{ins.payer_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ins.insurance_type} · {ins.subscriber_member_id}
                  </p>
                </div>
                <span className={ins.is_active ? 'text-xs text-green-700' : 'text-xs text-muted-foreground'}>
                  {ins.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Use Manage insurance to add, edit, or run eligibility checks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save / Cancel */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (!dirty) {
              navigate(`/p/${pid}/patients/${patient_id}`);
            } else {
              set_dirty(false);
              navigate(`/p/${pid}/patients/${patient_id}`);
            }
          }}
        >
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {dirty && <p className="text-xs text-muted-foreground">Unsaved changes</p>}
          <Button disabled={save_mut.isPending} onClick={handle_save}>
            {save_mut.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Navigation guard dialog */}
      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}
