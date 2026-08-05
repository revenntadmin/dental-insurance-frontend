import { formatDate } from '../lib/forms';
import { formatRelationship } from '../lib/insurancePlans';
import EligibilityStatus from './EligibilityStatus';

function Detail({ label, value, wide = false, mono = false }) {
  return (
    <div className={`plan-details__item${wide ? ' plan-details__item--wide' : ''}`}>
      <span className="plan-details__label">{label}</span>
      <span className={`plan-details__value${mono ? ' plan-details__value--mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

/** Read-only view of a plan, laid out like the card a patient hands over. */
export default function InsurancePlanDetails({ plan }) {
  const showReported = plan.payer_name_reported && plan.payer_name_reported !== plan.payer_name;

  return (
    <>
      {plan.eligibility && <EligibilityStatus eligibility={plan.eligibility} compact />}

      <div className="plan-details">
        <Detail label="Member ID" value={plan.member_id} wide mono />
        <Detail label="Payer ID" value={plan.payer_id} />
        <Detail label="Group" value={plan.group_number} />
        <Detail label="Plan type" value={plan.plan_type} />
        <Detail label="Subscriber" value={plan.subscriber_name} />
        <Detail label="Relationship" value={formatRelationship(plan.subscriber_relationship)} />
        <Detail label="Subscriber DOB" value={formatDate(plan.subscriber_dob)} />
        <Detail label="Effective" value={formatDate(plan.effective_date)} />
        <Detail label="Coverage" value={plan.coverage_status || '—'} />
      </div>

      {showReported && (
        <p className="form-hint plan-details__note">Reported as “{plan.payer_name_reported}”</p>
      )}
    </>
  );
}
