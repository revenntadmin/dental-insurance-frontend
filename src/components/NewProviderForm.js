import { useState } from 'react';
import apiClient from '../api/apiClient';
import ProviderFields from './ProviderFields';
import { getErrorMessage } from '../lib/apiError';
import { toFormValues } from '../lib/forms';
import { PROVIDER_FIELDS, toProviderCreateBody, validateProvider } from '../lib/providers';

/** Sits above the provider list while open. practice_id comes from the token. */
export default function NewProviderForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(() => toFormValues(null, PROVIDER_FIELDS));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const problem = validateProvider(form);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/provider', toProviderCreateBody(form));
      onCreated(data);
    } catch (err) {
      // A 409 means another provider in the practice already holds this NPI.
      setError(getErrorMessage(err, 'Failed to add provider'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="inline-form form-grid form-grid--full" onSubmit={handleSubmit}>
      <ProviderFields form={form} onChange={updateField} idPrefix="new-provider" />

      {error && <p className="form-error">{error}</p>}

      <div className="section-card__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add provider'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
