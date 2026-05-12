import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import ManualEntryForm from './entry/ManualEntryForm.jsx';
import UploadEntry from './entry/UploadEntry.jsx';
import QrScanEntry from './entry/QrScanEntry.jsx';
import { useCreatePatient } from '../../features/patients/queries.js';
import { useToast } from '../../hooks/use_toast.jsx';

const TABS = [
  { key: 'manual', label: 'Manual entry' },
  { key: 'upload', label: 'Upload card / file' },
  { key: 'scan', label: 'Scan with phone' },
];

export default function PatientEntryPage() {
  const [tab, setTab] = useState('manual');
  // Fields prefilled from extraction (upload or scan) carried into the manual form.
  const [prefill, setPrefill] = useState(null);
  const create = useCreatePatient();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(body) {
    try {
      const result = await create.mutateAsync(body);
      toast('Patient created.', 'success');
      navigate(`/patients/${result.patient_id}`);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  function handleExtraction(fields) {
    setPrefill(fields);
    setTab('manual');
    toast('Fields extracted — review and confirm.', 'success');
  }

  return (
    <div>
      <PageHeader title="Add patient" subtitle="Manual entry, document upload, or phone scan" />

      <div className="border-b border-slate-200 mb-6 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 ${
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'manual' && (
        <ManualEntryForm initial={prefill} onSubmit={handleSubmit} busy={create.isPending} />
      )}
      {tab === 'upload' && <UploadEntry onExtracted={handleExtraction} />}
      {tab === 'scan' && <QrScanEntry onExtracted={handleExtraction} />}
    </div>
  );
}
