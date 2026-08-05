import { formatDate } from '../lib/forms';
import { coverageBadgeClass, eligibilitySummary, formatCoverageStatus } from '../lib/eligibility';

export default function EligibilityStatus({ eligibility, compact = false }) {
  if (!eligibility) return null;

  const status = eligibility.coverage_status || eligibility.status || 'unknown';
  const summary = eligibilitySummary(eligibility);

  return (
    <div className={`eligibility-status${compact ? ' eligibility-status--compact' : ''}`}>
      <div className="eligibility-status__header">
        <span className="eligibility-status__label">Eligibility</span>
        <span className={`status-badge ${coverageBadgeClass(status)}`}>
          {formatCoverageStatus(status)}
        </span>
      </div>

      {summary && <p className="eligibility-status__summary">{summary}</p>}

      {!compact && (
        <div className="eligibility-status__details">
          {eligibility.plan_name && (
            <span>Plan: {eligibility.plan_name}</span>
          )}
          {eligibility.network_name && (
            <span>Network: {eligibility.network_name}</span>
          )}
          {eligibility.group_number_response && (
            <span>Group: {eligibility.group_number_response}</span>
          )}
          {eligibility.plan_begin_date && (
            <span>Effective: {formatDate(eligibility.plan_begin_date)}</span>
          )}
          {eligibility.plan_end_date && (
            <span>Through: {formatDate(eligibility.plan_end_date)}</span>
          )}
          {eligibility.checked_at && (
            <span>Checked: {formatDate(eligibility.checked_at)}</span>
          )}
        </div>
      )}

      {eligibility.payer_network_valid === false && eligibility.payer_network_message && (
        <p className="form-error eligibility-status__warning">
          {eligibility.payer_network_message}
        </p>
      )}
    </div>
  );
}
