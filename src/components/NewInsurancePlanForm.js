import { useState } from 'react';
import apiClient from '../api/apiClient';
import InsurancePlanFields from './InsurancePlanFields';
import EligibilityStatus from './EligibilityStatus';
import { getErrorMessage } from '../lib/apiError';
import { shouldPromptReentry } from '../lib/eligibility';
import { toFormValues } from '../lib/forms';
import { PLAN_CREATE_FIELDS } from '../lib/insurancePlans';

/** Always-editing row for adding coverage. Runs eligibility after save. */
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
  const [savedPlan, setSavedPlan] = useState(null);
  const [needsReentry, setNeedsReentry] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPlan() {
    const payload = PLAN_CREATE_FIELDS.reduce(
      (body, field) => {
        if (form[field].trim()) body[field] = form[field].trim();
        return body;
      },
      { patient_id: patientId },
    );

    const { data } = await apiClient.post('/api/insurance_plan', payload);
    return data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = savedPlan
        ? (await apiClient.patch(`/api/insurance_plan/${savedPlan.id}`, buildPatch())).data
        : await submitPlan();

      setSavedPlan(data);

      if (shouldPromptReentry(data.eligibility)) {
        setNeedsReentry(true);
        setError('Coverage is inactive or could not be verified. Update the insurance details and save again.');
        return;
      }

      if (data.eligibility?.payer_network_valid === false) {
        setNeedsReentry(true);
        setError(data.eligibility.payer_network_message || 'This payer is not enrolled for your practice.');
        return;
      }

      onCreated(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add insurance plan'));
    } finally {
      setSubmitting(false);
    }
  }

  function buildPatch() {
    return PLAN_CREATE_FIELDS.reduce((body, field) => {
      if (form[field].trim()) body[field] = form[field].trim();
      return body;
    }, {});
  }

  function handleDoneAnyway() {
    if (savedPlan) onCreated(savedPlan);
  }

  return (
    <section className="editable-row">
      <div className="section-card__header">
        <div className="plan-heading">
          <span className="plan-badge plan-badge--new">{needsReentry ? 'Review' : 'New'}</span>
        </div>
      </div>

      {savedPlan?.eligibility && (
        <EligibilityStatus eligibility={savedPlan.eligibility} />
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <InsurancePlanFields
            form={form}
            onChange={updateField}
            idPrefix="new-plan"
            orderOptions={orderOptions}
            creating={!savedPlan}
            payers={payers}
            payersLoading={payersLoading}
            payersError={payersError}
          />
        </div>

        {needsReentry && (
          <p className="form-hint">
            Stedi returned inactive or invalid coverage. Correct the member ID, payer, or subscriber
            details below and save again to re-check eligibility.
          </p>
        )}

        {error && <p className="form-error section-card__message">{error}</p>}

        <div className="section-card__actions">
          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Checking eligibility...'
              : needsReentry
                ? 'Save and re-check'
                : 'Add plan'}
          </button>
          {needsReentry && savedPlan && (
            <button
              type="button"
              className="button-secondary"
              onClick={handleDoneAnyway}
              disabled={submitting}
            >
              Keep plan anyway
            </button>
          )}
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
