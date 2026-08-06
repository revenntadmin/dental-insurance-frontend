import VerificationBadge from './VerificationBadge';
import VerifyResults from './VerifyResults';
import {
  canVerify,
  formatStatus,
  formatTime,
  humanize,
  needsHuman,
  verificationHint,
} from '../lib/appointments';
import { formatDate } from '../lib/forms';
import { patientName } from '../lib/patients';
import { providerName } from '../lib/providers';

export const ROW_COLUMNS = 7;

/**
 * One visit. The whole row opens the drawer, so the checkbox and the action buttons
 * stop the click from bubbling — otherwise selecting for a batch would also open a
 * panel over the grid the user is still working through.
 */
export default function AppointmentRow({
  appointment,
  selected,
  selectable,
  onToggleSelect,
  onOpen,
  onVerify,
  verifying,
  result,
  onDismissResult,
  error,
}) {
  const status = appointment.verification_status;
  const verifiable = canVerify(appointment);

  return (
    <>
      <tr className="data-table__row--clickable" onClick={() => onOpen(appointment.id)}>
        <td className="appt-row__select" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            disabled={!selected && !selectable}
            onChange={() => onToggleSelect(appointment.id)}
            aria-label={`Select ${patientName(appointment.patient)}`}
          />
        </td>

        <td className="appt-row__time">{formatTime(appointment.scheduled_at)}</td>

        <td>
          <span className="appt-row__patient">{patientName(appointment.patient)}</span>
          <span className="appt-row__meta">DOB {formatDate(appointment.patient?.dob)}</span>
        </td>

        <td>{appointment.provider ? providerName(appointment.provider) : '—'}</td>

        <td>
          <span className="appt-row__type">{humanize(appointment.appointment_type) || '—'}</span>
          <span className="appt-row__meta">{formatStatus(appointment.status)}</span>
        </td>

        <td>
          <VerificationBadge status={status} />
          {needsHuman(status) && (
            <span className="appt-row__meta">{verificationHint(status)}</span>
          )}
        </td>

        <td className="data-table__actions" onClick={(e) => e.stopPropagation()}>
          <div className="row-actions">
            <button
              type="button"
              className="section-card__edit"
              onClick={() => onVerify(appointment.id)}
              disabled={verifying || !verifiable}
              title={verifiable ? 'Run a 270 for every plan this patient holds' : verificationHint(status)}
            >
              {verifying ? 'Checking...' : 'Verify'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => onOpen(appointment.id)}
            >
              View
            </button>
          </div>
        </td>
      </tr>

      {(result || error) && (
        <tr className="data-table__row-message">
          <td colSpan={ROW_COLUMNS}>
            {error && <p className="form-error">{error}</p>}
            <VerifyResults result={result} onDismiss={() => onDismissResult(appointment.id)} />
          </td>
        </tr>
      )}
    </>
  );
}
