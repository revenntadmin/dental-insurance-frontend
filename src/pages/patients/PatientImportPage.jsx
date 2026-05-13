import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, FileText } from 'lucide-react';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useCsvImport } from '@/features/patients/useCsvImport';
import { useToast } from '@/hooks/useToast';
import { useLocalDraft } from '@/hooks/useLocalDraft';
import { api_error_code, api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const FIELDS = [
  { key: '', label: 'Skip this column' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'sex', label: 'Sex' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'address_line_1', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal code' },
  { key: 'chart_number', label: 'Chart number' },
  { key: 'primary_payer_name', label: 'Primary payer' },
  { key: 'primary_member_id', label: 'Primary member ID' },
];

export function PatientImportPage() {
  const pid = useTenancyParam();
  const navigate = useNavigate();
  const toast = useToast();
  const csv = useCsvImport(pid);
  const [step, set_step] = useState(1);
  const [draft, set_draft, clear_draft] = useLocalDraft(`csv-import-${pid}`, {
    upload_id: null,
    raw_headers: [],
    row_count: 0,
    column_map: {},
    validation: null,
    skipped: [],
  });
  const [limit_error, set_limit_error] = useState(null);
  const [file, set_file] = useState(null);

  async function on_upload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    set_file(f);
    set_limit_error(null);
    try {
      const data = await csv.upload.mutateAsync(f);
      set_draft({ ...draft, upload_id: data.upload_id, raw_headers: data.raw_headers, row_count: data.row_count, column_map: {} });
      const sugg = await csv.suggest.mutateAsync({ upload_id: data.upload_id }).catch(() => ({}));
      set_draft({
        ...draft,
        upload_id: data.upload_id,
        raw_headers: data.raw_headers,
        row_count: data.row_count,
        column_map: sugg?.column_map || {},
      });
      set_step(2);
    } catch (err) {
      const code = api_error_code(err);
      if (code === 'row_limit_exceeded') {
        const r = err?.response?.data || {};
        set_limit_error(`Your file has ${r.found} rows but the limit is ${r.limit}. Contact your admin to raise this limit.`);
      } else {
        toast.error(api_error_message(err));
      }
    }
  }

  async function on_validate() {
    try {
      const result = await csv.validate.mutateAsync({
        upload_id: draft.upload_id,
        column_map: draft.column_map,
      });
      set_draft({ ...draft, validation: result, skipped: [] });
      set_step(3);
    } catch (err) {
      toast.error(api_error_message(err));
    }
  }

  async function on_confirm() {
    try {
      const result = await csv.confirm.mutateAsync({
        upload_id: draft.upload_id,
        skipped_rows: draft.skipped,
      });
      toast.success(`Imported ${result.imported} of ${draft.row_count}`);
      clear_draft();
      set_step(4);
      set_draft({ ...draft, summary: result });
    } catch (err) {
      toast.error(api_error_message(err));
    }
  }

  function download_errors() {
    const rows = draft.validation?.rows || [];
    const errors = rows.filter((r) => r.status === 'error');
    const csv_text = [['row', 'message'], ...errors.map((e) => [e.row_number, e.messages.join('; ')])]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv_text], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'import_errors.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <PageHeader
        title="Import patients from CSV"
        description={`Step ${step} of 4`}
        actions={
          <Link to={`/p/${pid}/patients/imports`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Import history
            </Button>
          </Link>
        }
      />

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm">Upload a CSV (max 10 MB).</p>
            <Input type="file" accept=".csv,text/csv" onChange={on_upload} />
            {csv.upload.isPending && <p className="text-sm text-muted-foreground">Uploading {file?.name}…</p>}
            {limit_error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{limit_error}</div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Map CSV columns to ClearClaim fields.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV column</TableHead>
                  <TableHead>Map to</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.raw_headers.map((header) => {
                  const mapped = draft.column_map?.[header];
                  return (
                    <TableRow key={header}>
                      <TableCell className="font-mono text-xs">{header}</TableCell>
                      <TableCell>
                        <select
                          className="h-9 rounded-md border px-2 text-sm"
                          value={typeof mapped === 'object' ? mapped.field : mapped || ''}
                          onChange={(e) =>
                            set_draft({
                              ...draft,
                              column_map: { ...draft.column_map, [header]: e.target.value || '' },
                            })
                          }
                        >
                          {FIELDS.map((f) => (
                            <option key={f.key || '_skip'} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        {typeof mapped === 'object' && mapped?.confidence != null && (
                          <Badge variant="secondary">{Math.round(mapped.confidence * 100)}%</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => set_step(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={on_validate} disabled={csv.validate.isPending}>
                {csv.validate.isPending ? 'Validating…' : 'Preview rows'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {draft.validation?.summary?.ready || 0} ready · {draft.validation?.summary?.warning || 0} warning ·{' '}
                {draft.validation?.summary?.error || 0} error
              </p>
              <Button variant="outline" size="sm" onClick={download_errors}>
                <Download className="mr-2 h-4 w-4" /> Download error report
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Skip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(draft.validation?.rows || []).map((r) => (
                  <TableRow key={r.row_number}>
                    <TableCell>{r.row_number}</TableCell>
                    <TableCell>
                      <StatusPill status={r.status} />
                    </TableCell>
                    <TableCell>{[r.preview?.last_name, r.preview?.first_name].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell className="text-xs">{(r.messages || []).join('; ')}</TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={draft.skipped.includes(r.row_number)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...draft.skipped, r.row_number]
                            : draft.skipped.filter((n) => n !== r.row_number);
                          set_draft({ ...draft, skipped: next });
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => set_step(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to column mapping
              </Button>
              <Button onClick={on_confirm} disabled={csv.confirm.isPending}>
                {csv.confirm.isPending ? 'Importing…' : 'Import Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Import complete</h2>
            <p className="text-sm">
              Imported {draft.summary?.imported || 0} · Skipped {draft.summary?.skipped || 0} · Errors {draft.summary?.errors || 0}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/p/${pid}/patients`)}>View patients</Button>
              <Button
                variant="outline"
                onClick={() => {
                  set_step(1);
                  set_draft({ upload_id: null, raw_headers: [], row_count: 0, column_map: {}, validation: null, skipped: [] });
                }}
              >
                Run another import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    ready: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${map[status]}`}>{status}</span>;
}
