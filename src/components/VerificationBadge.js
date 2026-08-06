import {
  formatVerification,
  needsHuman,
  verificationBadgeClass,
  verificationHint,
} from '../lib/appointments';

/**
 * The six derived states, in one place. The status is computed per request from the
 * patient's plans and the visit's service date, so it is never something the row can
 * be edited into — only a check (or a new plan) moves it.
 */
export default function VerificationBadge({ status, size = 'default' }) {
  const hint = verificationHint(status);

  return (
    <span
      className={[
        'verify-badge',
        verificationBadgeClass(status),
        size === 'small' ? 'verify-badge--small' : '',
        needsHuman(status) ? 'verify-badge--attention' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={hint}
    >
      {formatVerification(status)}
    </span>
  );
}
