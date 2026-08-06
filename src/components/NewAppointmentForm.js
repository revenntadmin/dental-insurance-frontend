import { useState } from 'react';
import apiClient from '../api/apiClient';
import AppointmentFields from './AppointmentFields';
import PatientPicker from './PatientPicker';
import { getErrorMessage } from '../lib/apiError';
import {
  toAppointmentCreateBody,
  toAppointmentForm,
  validateAppointment,
} from '../lib/appointments';
import { useProviders } from '../hooks/useProviders';

/** Sits above the grid while open. practice_id comes from the token. */
export default function NewAppointmentForm({ onCreated, onCancel }) {
  const { providers, loading: providersLoading } = useProviders();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(() => toAppointmentForm(null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!patient) {
      setError('Choose a patient for this appointment.');
      return;
    }

    const problem = validateAppointment(form);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.post(
        '/api/appointment',
        toAppointmentCreateBody(form, patient.id),
      );
      onCreated(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create appointment'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form form-grid form-grid--full" onSubmit={handleSubmit}>
      <PatientPicker value={patient} onChange={setPatient} />

      <AppointmentFields
        form={form}
        onChange={updateField}
        idPrefix="new-appt"
        providers={providers}
        providersLoading={providersLoading}
      />

      {error && <p className="form-error">{error}</p>}

      <div className="section-card__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Booking...' : 'Book appointment'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
