import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { usePatient, useUpdatePatient } from '../../features/patients/queries.js';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { useToast } from '../../hooks/use_toast.jsx';

export default function InsuranceEntryPage() {
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, error } = usePatient(patient_id);
  const update = useUpdatePatient(patient_id);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    if (data?.insurance_policies) setPolicies(data.insurance_policies);
  }, [data]);

  function setField(idx, field, value) {
    setPolicies((p) => p.map((pol, i) => (i === idx ? { ...pol, [field]: value } : pol)));
  }

  function addPolicy() {
    setPolicies((p) => [
      ...p,
      {
        carrier_name: '',
        plan_name: '',
        member_id: '',
        group_number: '',
        relationship_to_subscriber: 'self',
        priority: p.length === 0 ? 'primary' : 'secondary',
      },
    ]);
  }

  function removePolicy(idx) {
    setPolicies((p) => p.filter((_, i) => i !== idx));
  }

  async function save() {
    try {
      await update.mutateAsync({ insurance_policies: policies });
      toast('Insurance saved.', 'success');
      navigate(`/patients/${patient_id}`);
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <PageHeader
        title="Edit insurance"
        subtitle={`${data.last_name}, ${data.first_name}`}
      />

      <div className="space-y-4">
        {policies.map((pol, idx) => (
          <div key={idx} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{pol.priority || 'primary'} insurance</h3>
              <button onClick={() => removePolicy(idx)} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Carrier" value={pol.carrier_name || ''} onChange={(e) => setField(idx, 'carrier_name', e.target.value)} />
              <Input label="Plan name" value={pol.plan_name || ''} onChange={(e) => setField(idx, 'plan_name', e.target.value)} />
              <Input label="Member ID" value={pol.member_id || ''} onChange={(e) => setField(idx, 'member_id', e.target.value)} />
              <Input label="Group number" value={pol.group_number || ''} onChange={(e) => setField(idx, 'group_number', e.target.value)} />
              <Select label="Priority" value={pol.priority || 'primary'} onChange={(e) => setField(idx, 'priority', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tertiary">Tertiary</option>
              </Select>
              <Select label="Relationship to subscriber" value={pol.relationship_to_subscriber || 'self'} onChange={(e) => setField(idx, 'relationship_to_subscriber', e.target.value)}>
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
        ))}

        <button onClick={addPolicy} className="text-sm text-brand-600 hover:underline">
          + Add another policy
        </button>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => navigate(`/patients/${patient_id}`)}>Cancel</Button>
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}
