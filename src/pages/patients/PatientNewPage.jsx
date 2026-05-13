import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useExtractDocument } from '@/features/patients/useExtractDocument';
import { useScanSession } from '@/features/patients/useScanSession';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api_client';
import { api_error_message } from '@/lib/api_client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfidenceField } from '@/components/ConfidenceField';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const empty_patient = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  sex: '',
  phone: '',
  email: '',
  address_line_1: '',
  city: '',
  state: '',
  postal_code: '',
};

export function PatientNewPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const toast = useToast();
  const [patient, set_patient] = useState(empty_patient);
  const [confidences, set_confidences] = useState({});

  const extract = useExtractDocument(pid);
  const scan = useScanSession(pid, 'patient_info');

  function update_field(name, value) {
    set_patient((p) => ({ ...p, [name]: value }));
  }

  function apply_extracted(payload) {
    const fields = payload?.fields || {};
    const next = { ...patient };
    const conf = { ...confidences };
    for (const key of Object.keys(empty_patient)) {
      if (fields[key]) {
        next[key] = fields[key].value ?? '';
        conf[key] = fields[key].confidence ?? null;
      }
    }
    set_patient(next);
    set_confidences(conf);
  }

  useEffect(() => {
    if (scan.status === 'completed' && scan.extracted) {
      apply_extracted(scan.extracted);
      toast.success('Patient info captured from phone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.status]);

  const create = useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/patients`, patient).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Patient created');
      navigate(`/p/${pid}/patients/${data.id}`);
    },
    onError: (err) => toast.error(api_error_message(err)),
  });

  return (
    <div>
      <PageHeader title="New patient" description="Add a patient manually, from a document, or by phone scan." />
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="scan">QR Scan</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <Card>
            <CardContent className="p-6">
              <ManualForm patient={patient} confidences={confidences} on_change={update_field} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <UploadForm
                pid={pid}
                extract={extract}
                on_extracted={apply_extracted}
                patient={patient}
                confidences={confidences}
                on_change={update_field}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scan">
          <Card>
            <CardContent className="p-6">
              <ScanForm scan={scan} />
              <div className="mt-6">
                <ManualForm patient={patient} confidences={confidences} on_change={update_field} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save patient'}
        </Button>
      </div>
    </div>
  );
}

function ManualForm({ patient, confidences, on_change }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ConfidenceField label="First name" name="first_name" value={patient.first_name} confidence={confidences.first_name} onChange={(v) => on_change('first_name', v)} />
      <ConfidenceField label="Last name" name="last_name" value={patient.last_name} confidence={confidences.last_name} onChange={(v) => on_change('last_name', v)} />
      <ConfidenceField label="Date of birth" name="date_of_birth" type="date" value={patient.date_of_birth} confidence={confidences.date_of_birth} onChange={(v) => on_change('date_of_birth', v)} />
      <div className="space-y-1.5">
        <Label htmlFor="sex">Sex</Label>
        <Input id="sex" value={patient.sex} onChange={(e) => on_change('sex', e.target.value)} />
      </div>
      <ConfidenceField label="Phone" name="phone" value={patient.phone} confidence={confidences.phone} onChange={(v) => on_change('phone', v)} />
      <ConfidenceField label="Email" name="email" value={patient.email} confidence={confidences.email} onChange={(v) => on_change('email', v)} />
      <ConfidenceField label="Address" name="address_line_1" value={patient.address_line_1} confidence={confidences.address_line_1} onChange={(v) => on_change('address_line_1', v)} />
      <div className="grid grid-cols-3 gap-2">
        <ConfidenceField label="City" name="city" value={patient.city} confidence={confidences.city} onChange={(v) => on_change('city', v)} />
        <ConfidenceField label="State" name="state" value={patient.state} confidence={confidences.state} onChange={(v) => on_change('state', v)} />
        <ConfidenceField label="Zip" name="postal_code" value={patient.postal_code} confidence={confidences.postal_code} onChange={(v) => on_change('postal_code', v)} />
      </div>
    </div>
  );
}

function UploadForm({ pid, extract, on_extracted, patient, confidences, on_change }) {
  const [file, set_file] = useState(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  function on_pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    set_file(f);
    extract.mutate(
      { file: f, document_type: 'patient_intake' },
      { onSuccess: (data) => on_extracted(data) },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input type="file" accept="image/jpeg,image/png,application/pdf" onChange={on_pick} />
        {extract.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {preview && <img src={preview} alt="preview" className="max-h-64 rounded-md border" />}
      {!pid && <p className="text-xs text-muted-foreground">Practice not loaded yet</p>}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Extracted fields</h3>
        <ManualForm patient={patient} confidences={confidences} on_change={on_change} />
      </div>
    </div>
  );
}

function ScanForm({ scan }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generate a QR code, scan it with your phone, then capture the document. The form will fill in automatically.
        </p>
        {!scan.session && (
          <Button onClick={() => scan.create_session()} disabled={scan.creating}>
            {scan.creating ? 'Generating…' : 'Generate QR code'}
          </Button>
        )}
        {scan.session && (
          <div className="flex flex-col items-start gap-3">
            <div className="rounded-lg border bg-white p-4">
              <QRCodeSVG value={scan.session.qr_url} size={200} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {scan.status === 'pending' && (
                <span className="inline-flex items-center text-muted-foreground" aria-live="polite">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for phone…
                </span>
              )}
              {scan.status === 'completed' && <span className="text-green-700">Captured!</span>}
              {scan.status === 'expired' && (
                <div className="flex items-center gap-2 text-red-700">
                  Link expired.{' '}
                  <Button size="sm" variant="outline" onClick={() => scan.create_session()}>
                    Generate New QR Code
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tip</p>
        <p>The QR encodes a one-time link. Once captured, the link expires automatically.</p>
      </div>
    </div>
  );
}
