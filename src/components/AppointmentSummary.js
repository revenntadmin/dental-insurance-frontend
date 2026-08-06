import {
  VERIFICATION_STATUSES,
  formatVerification,
  verificationBadgeClass,
  verificationHint,
} from '../lib/appointments';

/**
 * The header strip doubles as the verification filter: the counts are the reason
 * someone reaches for the filter in the first place, so clicking a count applies it
 * rather than making the user find the same word twice.
 *
 * Counts come from /summary, which covers the whole date range — not just the page of
 * rows currently loaded — so "14 not checked" stays true below a paged grid.
 */
export default function AppointmentSummary({ summary, selected, onToggle, loading }) {
  const counts = summary?.by_verification_status || {};

  return (
    <div className="appt-summary">
      <div className="appt-summary__total">
        <span className="appt-summary__total-value">{loading ? '—' : (summary?.total ?? 0)}</span>
        <span className="appt-summary__total-label">
          appointment{summary?.total === 1 ? '' : 's'} in range
        </span>
      </div>

      <div className="appt-summary__tiles">
        {VERIFICATION_STATUSES.map((status) => {
          const count = counts[status] || 0;
          const isOn = selected.includes(status);

          return (
            <button
              key={status}
              type="button"
              className={`appt-summary__tile ${verificationBadgeClass(status)}${
                isOn ? ' appt-summary__tile--on' : ''
              }${count === 0 ? ' appt-summary__tile--empty' : ''}`}
              onClick={() => onToggle(status)}
              aria-pressed={isOn}
              title={verificationHint(status)}
            >
              <span className="appt-summary__count">{loading ? '—' : count}</span>
              <span className="appt-summary__label">{formatVerification(status)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
