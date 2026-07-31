import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import EditableSection from '../../components/EditableSection';
import InsurancePlansCard from '../../components/InsurancePlansCard';
import { useAuth } from '../../context/AuthContext';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { getErrorMessage } from '../../lib/apiError';
import { practiceBasePath } from '../../lib/authNavigation';
import { changedFields, formatDate, toFormValues } from '../../lib/forms';
import { sortPlans } from '../../lib/insurancePlans';
import { PATIENT_FIELDS, patientName } from '../../lib/patients';

export default function PatientDetailPage() {
  useTenancyGuard();
  const { pid, patientId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const base = practiceBasePath(pid || profile?.practice_id);

  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /** GET and PATCH both return the patient with coverage nested. */
  function applyPatient(data) {
    setPatient(data);
    setForm(toFormValues(data, PATIENT_FIELDS));
    setPlans(data.insurance_plans || []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get(`/api/patient/${patientId}`)
      .then(({ data }) => {
        if (!cancelled) applyPatient(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load patient'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function savePersonalInfo() {
    const patch = changedFields(form, patient, PATIENT_FIELDS);
    if (Object.keys(patch).length === 0) {
      return 'No changes to save.';
    }

    const { data } = await apiClient.patch(`/api/patient/${patientId}`, patch);
    applyPatient(data);
    return 'Personal information updated.';
  }

  function handlePlanSaved(saved) {
    setPlans((current) => sortPlans(current.map((plan) => (plan.id === saved.id ? saved : plan))));
  }

  function handlePlanCreated(created) {
    setPlans((current) => sortPlans([...current, created]));
  }

  function handlePlanDeleted(deletedId) {
    setPlans((current) => current.filter((plan) => plan.id !== deletedId));
  }

  async function deletePatient() {
    await apiClient.delete(`/api/patient/${patientId}`);
    navigate(`${base}/patients`, { replace: true });
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!patient) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Patient</h1>
        </div>
        <p className="form-error">{error || 'Patient not found.'}</p>
        <Link to={`${base}/patients`}>Back to patients</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{patientName(patient)}</h1>
        <Link to={`${base}/patients`}>Back to patients</Link>
      </div>

      <EditableSection
        title="Personal information"
        deleteLabel="Delete patient"
        deleteConfirmMessage="Delete this patient and all of their coverage?"
        onSave={savePersonalInfo}
        onCancel={() => setForm(toFormValues(patient, PATIENT_FIELDS))}
        onDelete={deletePatient}
      >
        {({ editing }) => (
          <>
            <div className="form-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                disabled={!editing}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                disabled={!editing}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => updateField('dob', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field">
              <label htmlFor="guarantorName">Guarantor name</label>
              <input
                id="guarantorName"
                type="text"
                value={form.guarantor_name}
                onChange={(e) => updateField('guarantor_name', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                disabled={!editing}
              />
            </div>

            <hr className="section-card__divider" />

            <h3 className="section-card__subtitle">Record</h3>
            <p className="form-hint">
              These details are managed by the system and cannot be edited.
            </p>

            <div className="form-field">
              <label htmlFor="dataSource">Source</label>
              <input id="dataSource" type="text" value={patient.data_source || 'manual'} disabled />
            </div>

            <div className="form-field">
              <label htmlFor="lastConfirmed">Last confirmed</label>
              <input
                id="lastConfirmed"
                type="text"
                value={formatDate(patient.last_confirmed_at)}
                disabled
              />
            </div>

            <div className="form-field">
              <label htmlFor="createdAt">Created</label>
              <input id="createdAt" type="text" value={formatDate(patient.created_at)} disabled />
            </div>
          </>
        )}
      </EditableSection>

      <InsurancePlansCard
        patientId={patient.id}
        plans={plans}
        onPlanSaved={handlePlanSaved}
        onPlanCreated={handlePlanCreated}
        onPlanDeleted={handlePlanDeleted}
      />
    </div>
  );
}
