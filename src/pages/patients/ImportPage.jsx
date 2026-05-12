import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import { apiClient } from '../../lib/api_client.js';
import { usePracticeId } from '../../hooks/use_practice.js';
import { useToast } from '../../hooks/use_toast.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';

const STEPS = ['Upload', 'Map columns', 'Validate', 'Preview', 'Confirm'];

export default function ImportPage() {
  const practice_id = usePracticeId();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [importId, setImportId] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [suggestedMapping, setSuggestedMapping] = useState({});
  const [mapping, setMapping] = useState({});
  const [validation, setValidation] = useState(null); // { rows: [{row_number, status, errors, data}], summary }
  const [skipped, setSkipped] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const canonicalFields = [
    'first_name', 'last_name', 'date_of_birth', 'gender',
    'phone', 'email', 'address_line1', 'address_line2', 'city', 'state', 'postal_code',
    'insurance_carrier_name', 'insurance_member_id', 'insurance_group_number',
    'subscriber_first_name', 'subscriber_last_name', 'subscriber_date_of_birth',
    'relationship_to_subscriber',
  ];

  async function downloadTemplate() {
    try {
      const res = await apiClient.get(
        `/api/practice/${practice_id}/patients/import/template`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clearclaim-patient-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message || 'Could not download template', 'error');
    }
  }

  async function upload() {
    if (!file) return toast('Choose a CSV file first.', 'error');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/patients/import/upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setImportId(data.import_id);
      setRawHeaders(data.raw_headers || []);
      setSuggestedMapping(data.suggested_mapping || {});
      setMapping(data.suggested_mapping || {});
      setStep(1);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    setBusy(true);
    try {
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/patients/import/${importId}/validate`,
        { mapping }
      );
      setValidation(data);
      setSkipped(new Set());
      setStep(3);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      const skip_row_numbers = Array.from(skipped);
      const { data } = await apiClient.post(
        `/api/practice/${practice_id}/patients/import/${importId}/confirm`,
        { skip_row_numbers }
      );
      toast(`Imported ${data.created_count} patient(s).`, 'success');
      navigate('/patients');
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function toggleSkip(rowNumber) {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function downloadErrorReport() {
    try {
      const res = await apiClient.get(
        `/api/practice/${practice_id}/patients/import/${importId}/errors.csv`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-errors.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message || 'Could not download error report', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Import patients"
        subtitle="Upload a CSV, map columns, review, and confirm."
        actions={<Button variant="secondary" onClick={downloadTemplate}>Download template</Button>}
      />

      <ol className="flex items-center gap-4 mb-6 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
            <span className={i === step ? 'font-medium text-slate-900' : 'text-slate-500'}>{label}</span>
            {i < STEPS.length - 1 && <span className="text-slate-300">›</span>}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="card p-6 max-w-xl">
          <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file && <div className="text-sm text-slate-600 mt-2">{file.name}</div>}
          <div className="mt-4 flex justify-end">
            <Button onClick={upload} disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-3">Map CSV columns</h3>
          <p className="text-sm text-slate-500 mb-4">
            We’ve auto-suggested mappings based on your CSV headers. Adjust any that look wrong.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {rawHeaders.map((header) => (
              <div key={header} className="flex items-center gap-3">
                <div className="w-1/2 truncate text-slate-700">{header}</div>
                <div className="text-slate-400">→</div>
                <select
                  className="input flex-1"
                  value={mapping[header] || ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value }))}
                >
                  <option value="">— skip column —</option>
                  {canonicalFields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                {suggestedMapping[header] && suggestedMapping[header] !== mapping[header] && (
                  <span className="text-xs text-slate-400">(suggested: {suggestedMapping[header]})</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => { setStep(2); validate(); }} disabled={busy}>
              {busy ? 'Validating…' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-10 text-center text-sm text-slate-500">Validating rows…</div>
      )}

      {step === 3 && validation && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Validation preview</h3>
              <div className="text-xs text-slate-500 mt-1">
                {validation.summary?.ready_count ?? 0} ready · {validation.summary?.warning_count ?? 0} warnings · {validation.summary?.error_count ?? 0} errors
              </div>
            </div>
            <Button variant="secondary" onClick={downloadErrorReport}>Download error report</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
              <tr>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">DOB</th>
                <th className="px-3 py-2">Issues</th>
                <th className="px-3 py-2">Skip</th>
              </tr>
            </thead>
            <tbody>
              {validation.rows?.map((r) => (
                <tr key={r.row_number} className="border-t border-slate-100">
                  <td className="px-3 py-2">{r.row_number}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2">{r.data?.last_name}, {r.data?.first_name}</td>
                  <td className="px-3 py-2">{r.data?.date_of_birth}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{(r.errors || r.warnings || []).join('; ')}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={skipped.has(r.row_number) || r.status === 'error'}
                      disabled={r.status === 'error'}
                      onChange={() => toggleSkip(r.row_number)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t border-slate-200 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>Back to mapping</Button>
            <Button onClick={() => { setStep(4); confirm(); }} disabled={busy}>
              {busy ? 'Importing…' : `Confirm import (${(validation.summary?.ready_count ?? 0) - skipped.size} rows)`}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-10 text-center text-sm text-slate-500">Importing…</div>
      )}
    </div>
  );
}
