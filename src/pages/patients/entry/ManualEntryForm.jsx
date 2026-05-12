import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import ConfidenceField from '../../../components/shared/ConfidenceField.jsx';

const blankPatient = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
};

const blankInsurance = {
  carrier_name: '',
  plan_name: '',
  member_id: '',
  group_number: '',
  relationship_to_subscriber: 'self',
  subscriber_first_name: '',
  subscriber_last_name: '',
  subscriber_date_of_birth: '',
};

export default function ManualEntryForm({ initial, onSubmit, busy }) {
  const [patient, setPatient] = useState(blankPatient);
  const [insurance, setInsurance] = useState(blankInsurance);
  const [confidence, setConfidence] = useState({}); // field -> 0..1

  useEffect(() => {
    if (!initial) return;
    if (initial.patient) setPatient((p) => ({ ...p, ...stripNulls(initial.patient) }));
    if (initial.insurance) setInsurance((i) => ({ ...i, ...stripNulls(initial.insurance) }));
    if (initial.confidence) setConfidence(initial.confidence);
  }, [initial]);

  function setP(field, value) {
    setPatient((prev) => ({ ...prev, [field]: value }));
  }
  function setI(field, value) {
    setInsurance((prev) => ({ ...prev, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      patient,
      insurance: insurance.carrier_name || insurance.member_id ? insurance : null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card p-5">
        <h3 className="font-semibold mb-4">Patient demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfidenceField label="First name" value={patient.first_name} onChange={(v) => setP('first_name', v)} confidence={confidence.first_name} />
          <ConfidenceField label="Last name" value={patient.last_name} onChange={(v) => setP('last_name', v)} confidence={confidence.last_name} />
          <ConfidenceField label="Date of birth" type="date" value={patient.date_of_birth} onChange={(v) => setP('date_of_birth', v)} confidence={confidence.date_of_birth} />
          <Select label="Gender" value={patient.gender} onChange={(e) => setP('gender', e.target.value)}>
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
          <Input label="Phone" value={patient.phone} onChange={(e) => setP('phone', e.target.value)} />
          <Input label="Email" type="email" value={patient.email} onChange={(e) => setP('email', e.target.value)} />
          <Input label="Address" className="md:col-span-2" value={patient.address_line1} onChange={(e) => setP('address_line1', e.target.value)} />
          <Input label="City" value={patient.city} onChange={(e) => setP('city', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="State" value={patient.state} onChange={(e) => setP('state', e.target.value)} />
            <Input label="Postal code" value={patient.postal_code} onChange={(e) => setP('postal_code', e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold mb-4">Primary insurance (optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfidenceField label="Carrier" value={insurance.carrier_name} onChange={(v) => setI('carrier_name', v)} confidence={confidence.carrier_name} />
          <ConfidenceField label="Plan name" value={insurance.plan_name} onChange={(v) => setI('plan_name', v)} confidence={confidence.plan_name} />
          <ConfidenceField label="Member ID" value={insurance.member_id} onChange={(v) => setI('member_id', v)} confidence={confidence.member_id} />
          <ConfidenceField label="Group number" value={insurance.group_number} onChange={(v) => setI('group_number', v)} confidence={confidence.group_number} />
          <Select label="Relationship to subscriber" value={insurance.relationship_to_subscriber} onChange={(e) => setI('relationship_to_subscriber', e.target.value)}>
            <option value="self">Self</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="other">Other</option>
          </Select>
          {insurance.relationship_to_subscriber !== 'self' && (
            <>
              <Input label="Subscriber first name" value={insurance.subscriber_first_name} onChange={(e) => setI('subscriber_first_name', e.target.value)} />
              <Input label="Subscriber last name" value={insurance.subscriber_last_name} onChange={(e) => setI('subscriber_last_name', e.target.value)} />
              <Input label="Subscriber DOB" type="date" value={insurance.subscriber_date_of_birth} onChange={(e) => setI('subscriber_date_of_birth', e.target.value)} />
            </>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create patient'}</Button>
      </div>
    </form>
  );
}

function stripNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v != null) out[k] = v;
  return out;
}
