import { useState } from 'react';
import apiClient from '../api/apiClient';
import EditableSection from './EditableSection';
import InsurancePlanDetails from './InsurancePlanDetails';
import InsurancePlanFields from './InsurancePlanFields';
import { changedFields, toFormValues } from '../lib/forms';
import { PLAN_FIELDS, availableOrders, formatCoordinationOrder } from '../lib/insurancePlans';
import { shouldPromptReentry } from '../lib/eligibility';
import EligibilityStatus from './EligibilityStatus';

/** One saved plan inside the shared insurance card, editable on its own. */
export default function InsurancePlanRow({
  plan,
  plans,
  payers,
  payersLoading,
  payersError,
  onSaved,
  onDeleted,
}) {
  const [form, setForm] = useState(() => toFormValues(plan, PLAN_FIELDS));
  const [eligibilityNotice, setEligibilityNotice] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    const patch = changedFields(form, plan, PLAN_FIELDS);
    if (Object.keys(patch).length === 0) {
      return 'No changes to save.';
    }

    const { data } = await apiClient.patch(`/api/insurance_plan/${plan.id}`, patch);
    setForm(toFormValues(data, PLAN_FIELDS));
    onSaved(data);
    if (shouldPromptReentry(data.eligibility)) {
      setEligibilityNotice('Coverage is inactive. Update the insurance details and save again.');
      return 'Plan saved, but coverage is inactive.';
    }
    setEligibilityNotice('');
    return 'Insurance plan updated.';
  }

  async function handleDelete() {
    await apiClient.delete(`/api/insurance_plan/${plan.id}`);
    onDeleted(plan.id);
  }

  const order = plan.coordination_order;
  const heading = (
    <div className="plan-heading">
      <span className={`plan-badge plan-badge--${order || 'none'}`}>
        {formatCoordinationOrder(order)}
      </span>
      <span className="plan-heading__payer">{plan.payer_name || 'Unknown payer'}</span>
    </div>
  );

  return (
    <EditableSection
      variant="row"
      title={heading}
      bodyClassName={(editing) => (editing ? 'form-grid' : '')}
      deleteLabel="Delete plan"
      deleteConfirmMessage="Remove this coverage from the patient?"
      onSave={handleSave}
      onCancel={() => {
        setForm(toFormValues(plan, PLAN_FIELDS));
        setEligibilityNotice('');
      }}
      onDelete={handleDelete}
    >
      {({ editing }) =>
        editing ? (
          <>
            {plan.eligibility && <EligibilityStatus eligibility={plan.eligibility} compact />}
            {eligibilityNotice && <p className="form-error">{eligibilityNotice}</p>}
            <InsurancePlanFields
            form={form}
            onChange={updateField}
            idPrefix={`plan-${plan.id}`}
            orderOptions={availableOrders(plans, order)}
            payerName={plan.payer_name}
            payerNameReported={plan.payer_name_reported}
            payers={payers}
            payersLoading={payersLoading}
            payersError={payersError}
          />
          </>
        ) : (
          <InsurancePlanDetails plan={plan} />
        )
      }
    </EditableSection>
  );
}
