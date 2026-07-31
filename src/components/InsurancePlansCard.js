import { useState } from 'react';
import InsurancePlanRow from './InsurancePlanRow';
import NewInsurancePlanForm from './NewInsurancePlanForm';
import { availableOrders } from '../lib/insurancePlans';

/** All of a patient's coverage in one card, one editable row per plan. */
export default function InsurancePlansCard({
  patientId,
  plans,
  onPlanSaved,
  onPlanCreated,
  onPlanDeleted,
}) {
  const [adding, setAdding] = useState(false);
  const openOrders = availableOrders(plans);

  function handleCreated(plan) {
    // Close first: the plan is already saved, so a throw upstream must not
    // leave the form open looking like the create failed.
    setAdding(false);
    onPlanCreated(plan);
  }

  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2 className="section-card__title">Insurance plans</h2>
        {!adding && openOrders.length > 0 && (
          <button type="button" className="section-card__edit" onClick={() => setAdding(true)}>
            Add plan
          </button>
        )}
      </div>

      {plans.length === 0 && !adding && (
        <p className="form-hint">No insurance plans on file for this patient.</p>
      )}

      {plans.map((plan) => (
        <InsurancePlanRow
          key={plan.id}
          plan={plan}
          plans={plans}
          onSaved={onPlanSaved}
          onDeleted={onPlanDeleted}
        />
      ))}

      {adding && (
        <NewInsurancePlanForm
          patientId={patientId}
          orderOptions={openOrders}
          onCreated={handleCreated}
          onCancel={() => setAdding(false)}
        />
      )}
    </section>
  );
}
