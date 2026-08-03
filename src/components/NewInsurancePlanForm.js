import { useState } from 'react';
import apiClient from '../api/apiClient';
import InsurancePlanFields from './InsurancePlanFields';
import { getErrorMessage } from '../lib/apiError';
import { toFormValues } from '../lib/forms';
import { PLAN_CREATE_FIELDS } from '../lib/insurancePlans';

/** Always-editing row for adding coverage. `orderOptions` excludes taken slots. */
export default function NewInsurancePlanForm({
  patientId,
  orderOptions,
  payers,
  payersLoading,
  payersError,
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...toFormValues(null, PLAN_CREATE_FIELDS),
    coordination_order: orderOptions[0] || '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Empty strings would fail the API's enum checks, so send only filled fields.
      const payload = PLAN_CREATE_FIELDS.reduce(
        (body, field) => {
          if (form[field].trim()) body[field] = form[field].trim();
          return body;
        },
        { patient_id: patientId },
      );

      const { data } = await apiClient.post('/api/insurance_plan', payload);
      onCreated(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add insurance plan'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="editable-row">
      <div className="section-card__header">
        <div className="plan-heading">
          <span className="plan-badge plan-badge--new">New</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <InsurancePlanFields
            form={form}
            onChange={updateField}
            idPrefix="new-plan"
            orderOptions={orderOptions}
            creating
            payers={payers}
            payersLoading={payersLoading}
            payersError={payersError}
          />
        </div>

        {error && <p className="form-error section-card__message">{error}</p>}

        <div className="section-card__actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add plan'}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
