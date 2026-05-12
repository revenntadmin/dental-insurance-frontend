import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useCreateClaim } from '../../features/claims/queries.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function ClaimCreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const create = useCreateClaim();

  const [patient_id, setPatientId] = useState(searchParams.get('patient_id') || '');
  const [service_date, setServiceDate] = useState('');
  const [provider_id, setProviderId] = useState('');
  const [lines, setLines] = useState([
    { cdt_code: '', tooth_number: '', surface: '', fee_cents: 0, description: '' },
  ]);

  function addLine() {
    setLines((ls) => [...ls, { cdt_code: '', tooth_number: '', surface: '', fee_cents: 0, description: '' }]);
  }
  function setLine(idx, field, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }
  function removeLine(idx) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const body = {
        patient_id,
        rendering_provider_id: provider_id,
        service_date,
        service_lines: lines.map((l) => ({
          ...l,
          fee_cents: Number(l.fee_cents) || 0,
        })),
      };
      const result = await create.mutateAsync(body);
      toast('Claim created.', 'success');
      navigate(`/claims/${result.claim_id}`);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  return (
    <div>
      <PageHeader title="New claim" />

      <form onSubmit={submit} className="space-y-4">
        <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Patient ID" value={patient_id} onChange={(e) => setPatientId(e.target.value)} required />
          <Input label="Rendering provider ID" value={provider_id} onChange={(e) => setProviderId(e.target.value)} required />
          <Input label="Service date" type="date" value={service_date} onChange={(e) => setServiceDate(e.target.value)} required />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Service lines</h3>
            <button type="button" onClick={addLine} className="text-sm text-brand-600 hover:underline">+ Add line</button>
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <Input label="CDT code" value={line.cdt_code} onChange={(e) => setLine(idx, 'cdt_code', e.target.value)} required />
                <Input label="Tooth" value={line.tooth_number} onChange={(e) => setLine(idx, 'tooth_number', e.target.value)} />
                <Input label="Surface" value={line.surface} onChange={(e) => setLine(idx, 'surface', e.target.value)} />
                <Input label="Fee (cents)" type="number" value={line.fee_cents} onChange={(e) => setLine(idx, 'fee_cents', e.target.value)} />
                <Input label="Description" value={line.description} onChange={(e) => setLine(idx, 'description', e.target.value)} className="md:col-span-2" />
                <button type="button" onClick={() => removeLine(idx)} className="text-sm text-red-600 hover:underline md:col-span-6 text-right">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create claim'}</Button>
        </div>
      </form>
    </div>
  );
}
