import AppointmentRow, { ROW_COLUMNS } from './AppointmentRow';
import { formatDayHeading, groupByDay, needsHuman } from '../lib/appointments';

/**
 * The grid is grouped by service date rather than being one flat list: a front desk
 * works a day at a time, and the day heading is where "three of tomorrow's eight still
 * need a human" belongs.
 *
 * Days keep whatever order the API sorted them into, so flipping to latest-first
 * reorders the headings too.
 */
export default function AppointmentGrid({
  appointments,
  selectedIds,
  selectable,
  onToggleSelect,
  onToggleDay,
  onOpen,
  onVerify,
  verifyingIds,
  results,
  errors,
  onDismissResult,
}) {
  const days = groupByDay(appointments);

  return (
    <table className="data-table appt-table">
      <thead>
        <tr>
          <th className="appt-row__select" aria-label="Select" />
          <th>Time</th>
          <th>Patient</th>
          <th>Provider</th>
          <th>Type</th>
          <th>Verification</th>
          <th className="data-table__actions" aria-label="Actions" />
        </tr>
      </thead>

      {days.map((day) => {
        const attention = day.appointments.filter((appointment) =>
          needsHuman(appointment.verification_status),
        ).length;
        const dayIds = day.appointments.map((appointment) => appointment.id);
        const allSelected = dayIds.every((id) => selectedIds.includes(id));

        return (
          <tbody key={day.date || 'unscheduled'}>
            <tr className="appt-day">
              <td colSpan={ROW_COLUMNS}>
                <div className="appt-day__heading">
                  <button
                    type="button"
                    className="appt-day__select"
                    onClick={() => onToggleDay(dayIds, !allSelected)}
                  >
                    {allSelected ? 'Clear day' : 'Select day'}
                  </button>
                  <span className="appt-day__date">{formatDayHeading(day.date)}</span>
                  <span className="appt-day__count">
                    {day.appointments.length} visit{day.appointments.length === 1 ? '' : 's'}
                  </span>
                  {attention > 0 && (
                    <span className="appt-day__attention">{attention} need attention</span>
                  )}
                </div>
              </td>
            </tr>

            {day.appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                selected={selectedIds.includes(appointment.id)}
                selectable={selectable}
                onToggleSelect={onToggleSelect}
                onOpen={onOpen}
                onVerify={onVerify}
                verifying={verifyingIds.includes(appointment.id)}
                result={results[appointment.id]}
                error={errors[appointment.id]}
                onDismissResult={onDismissResult}
              />
            ))}
          </tbody>
        );
      })}
    </table>
  );
}
