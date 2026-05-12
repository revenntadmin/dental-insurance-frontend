import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApiClient } from '../../lib/api_client.js';

const blankPatient = {
  first_name: '', last_name: '', date_of_birth: '', gender: '',
  phone: '', email: '',
  address_line1: '', address_line2: '', city: '', state: '', postal_code: '',
};
const blankInsurance = {
  carrier_name: '', plan_name: '', member_id: '', group_number: '',
  relationship_to_subscriber: 'self',
  subscriber_first_name: '', subscriber_last_name: '', subscriber_date_of_birth: '',
};

export default function IntakePage() {
  const { token } = useParams();
  const [practice, setPractice] = useState(null);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(blankPatient);
  const [insurance, setInsurance] = useState(blankInsurance);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return setError('Invalid intake link.');
    publicApiClient.get(`/api/intake/${token}`)
      .then((r) => setPractice(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Intake link is invalid or expired.'));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicApiClient.post(`/api/intake/${token}/submit`, { patient, insurance });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-slate-600">{error}</div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-emerald-600 text-4xl mb-2">✓</div>
          <h1 className="text-xl font-semibold">Thanks!</h1>
          <p className="text-sm text-slate-500 mt-2">
            Your information was sent to the front desk. Please return to the staff to check in.
          </p>
        </div>
      </div>
    );
  }

  if (!practice) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-xl font-semibold">{practice.practice_name}</div>
          <div className="text-sm text-slate-500">Please fill in your details before your visit.</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Section title="About you">
            <Field label="First name" value={patient.first_name} onChange={(v) => setPatient({ ...patient, first_name: v })} required />
            <Field label="Last name" value={patient.last_name} onChange={(v) => setPatient({ ...patient, last_name: v })} required />
            <Field label="Date of birth" type="date" value={patient.date_of_birth} onChange={(v) => setPatient({ ...patient, date_of_birth: v })} required />
            <Field label="Phone" type="tel" value={patient.phone} onChange={(v) => setPatient({ ...patient, phone: v })} />
            <Field label="Email" type="email" value={patient.email} onChange={(v) => setPatient({ ...patient, email: v })} />
          </Section>

          <Section title="Address">
            <Field label="Street" value={patient.address_line1} onChange={(v) => setPatient({ ...patient, address_line1: v })} />
            <Field label="Apt / suite" value={patient.address_line2} onChange={(v) => setPatient({ ...patient, address_line2: v })} />
            <Field label="City" value={patient.city} onChange={(v) => setPatient({ ...patient, city: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="State" value={patient.state} onChange={(v) => setPatient({ ...patient, state: v })} />
              <Field label="ZIP" value={patient.postal_code} onChange={(v) => setPatient({ ...patient, postal_code: v })} />
            </div>
          </Section>

          <Section title="Insurance">
            <Field label="Carrier" value={insurance.carrier_name} onChange={(v) => setInsurance({ ...insurance, carrier_name: v })} />
            <Field label="Plan name" value={insurance.plan_name} onChange={(v) => setInsurance({ ...insurance, plan_name: v })} />
            <Field label="Member ID" value={insurance.member_id} onChange={(v) => setInsurance({ ...insurance, member_id: v })} />
            <Field label="Group number" value={insurance.group_number} onChange={(v) => setInsurance({ ...insurance, group_number: v })} />
            <div>
              <label className="label">Relationship to subscriber</label>
              <select
                className="input"
                value={insurance.relationship_to_subscriber}
                onChange={(e) => setInsurance({ ...insurance, relationship_to_subscriber: e.target.value })}
              >
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="other">Other</option>
              </select>
            </div>
            {insurance.relationship_to_subscriber !== 'self' && (
              <>
                <Field label="Subscriber first name" value={insurance.subscriber_first_name} onChange={(v) => setInsurance({ ...insurance, subscriber_first_name: v })} />
                <Field label="Subscriber last name" value={insurance.subscriber_last_name} onChange={(v) => setInsurance({ ...insurance, subscriber_last_name: v })} />
                <Field label="Subscriber DOB" type="date" value={insurance.subscriber_date_of_birth} onChange={(v) => setInsurance({ ...insurance, subscriber_date_of_birth: v })} />
              </>
            )}
          </Section>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input"
      />
    </div>
  );
}
