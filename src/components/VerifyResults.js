import EligibilityStatus from './EligibilityStatus';
import { formatMoney, verifyOutcome } from '../lib/appointments';
import { formatCoordinationOrder } from '../lib/insurancePlans';

/**
 * One block per plan, never one answer per patient. A patient with primary and
 * secondary coverage gets two 270s and two verdicts, and the secondary is exactly the
 * one a summarised view would hide — so each plan states its own outcome, including
 * the ones that failed while their neighbours succeeded.
 */
export default function VerifyResults({ result, onDismiss }) {
  if (!result) return null;

  const plans = result.results || [];
  const { failed } = verifyOutcome(result);

  return (
    <div className="verify-results">
      <div className="verify-results__header">
        <span className="verify-results__title">
          Checked {result.plans_checked ?? plans.length} plan
          {(result.plans_checked ?? plans.length) === 1 ? '' : 's'}
          {failed > 0 && <span className="verify-results__failed"> · {failed} failed</span>}
        </span>
        {onDismiss && (
          <button type="button" className="verify-results__dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>

      {plans.length === 0 && (
        <p className="form-hint">The payer returned nothing for this visit.</p>
      )}

      {plans.map((plan) => (
        <div
          key={plan.insurance_plan_id}
          className={`verify-result${plan.ok ? '' : ' verify-result--error'}`}
        >
          <div className="verify-result__header">
            <span className="verify-result__payer">{plan.payer_name || 'Unnamed payer'}</span>
            {plan.coordination_order && (
              <span className={`plan-badge plan-badge--${plan.coordination_order}`}>
                {formatCoordinationOrder(plan.coordination_order)}
              </span>
            )}
          </div>

          {plan.ok ? (
            <>
              <EligibilityStatus eligibility={plan.check} />
              {(plan.check?.deductible_remaining !== undefined
                || plan.check?.annual_max_remaining !== undefined) && (
                <div className="verify-result__benefits">
                  <span>Deductible left: {formatMoney(plan.check?.deductible_remaining)}</span>
                  <span>Annual max left: {formatMoney(plan.check?.annual_max_remaining)}</span>
                </div>
              )}
            </>
          ) : (
            <p className="form-error">
              {plan.message || 'The check failed.'}
              {plan.error && <span className="verify-result__code"> ({plan.error})</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
