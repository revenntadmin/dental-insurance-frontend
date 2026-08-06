import {
  APPOINTMENT_STATUSES,
  DEFAULT_FRESH_DAYS,
  addDays,
  formatStatus,
  humanize,
  todayIso,
} from '../lib/appointments';
import { providerName } from '../lib/providers';

/**
 * Everything that narrows the grid, except the verification status — that lives on the
 * summary tiles, where the counts are.
 *
 * The presets exist because the two questions a front desk asks are "what is coming up"
 * and "what happened today"; both are a date range nobody wants to type.
 */
export default function AppointmentFilters({
  filters,
  onChange,
  search,
  onSearchChange,
  providers,
  providersLoading,
  typeOptions,
}) {
  function set(patch) {
    onChange({ ...filters, ...patch });
  }

  function applyPreset(days) {
    const from = todayIso();
    set({ from, to: addDays(from, days - 1) });
  }

  function toggleStatus(status) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((value) => value !== status)
      : [...filters.statuses, status];
    set({ statuses: next });
  }

  const isPreset = (days) => filters.from === todayIso() && filters.to === addDays(todayIso(), days - 1);

  return (
    <div className="appt-filters">
      <div className="appt-filters__row">
        <div className="appt-filters__field">
          <label htmlFor="apptFrom">From</label>
          <input
            id="apptFrom"
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
          />
        </div>

        <div className="appt-filters__field">
          <label htmlFor="apptTo">To</label>
          <input
            id="apptTo"
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
          />
        </div>

        <div className="appt-filters__presets">
          <button
            type="button"
            className={`chip${isPreset(1) ? ' chip--on' : ''}`}
            onClick={() => applyPreset(1)}
          >
            Today
          </button>
          <button
            type="button"
            className={`chip${isPreset(7) ? ' chip--on' : ''}`}
            onClick={() => applyPreset(7)}
          >
            Next 7 days
          </button>
          <button
            type="button"
            className={`chip${isPreset(14) ? ' chip--on' : ''}`}
            onClick={() => applyPreset(14)}
          >
            Next 14 days
          </button>
        </div>
      </div>

      <div className="appt-filters__row">
        <div className="appt-filters__field appt-filters__field--grow">
          <label htmlFor="apptSearch">Patient</label>
          <input
            id="apptSearch"
            type="search"
            placeholder="Search by patient name"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="appt-filters__field">
          <label htmlFor="apptProvider">Provider</label>
          <select
            id="apptProvider"
            value={filters.providerId}
            onChange={(e) => set({ providerId: e.target.value })}
          >
            <option value="">All providers</option>
            {providersLoading && <option disabled>Loading...</option>}
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {providerName(provider)}
              </option>
            ))}
          </select>
        </div>

        <div className="appt-filters__field">
          <label htmlFor="apptType">Type</label>
          <select
            id="apptType"
            value={filters.appointmentType}
            onChange={(e) => set({ appointmentType: e.target.value })}
          >
            <option value="">All types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {humanize(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="appt-filters__field appt-filters__field--narrow">
          <label htmlFor="apptFresh" title="A check older than this many days is stale.">
            Fresh for
          </label>
          <input
            id="apptFresh"
            type="number"
            min="1"
            max="365"
            value={filters.freshDays}
            onChange={(e) => set({ freshDays: e.target.value })}
            onBlur={(e) => {
              // The API caps at 365 and rejects 0; clamp rather than surfacing a 400.
              const days = Number(e.target.value);
              if (!days || days < 1) set({ freshDays: DEFAULT_FRESH_DAYS });
              else if (days > 365) set({ freshDays: 365 });
            }}
          />
        </div>

        <div className="appt-filters__field appt-filters__field--narrow">
          <label htmlFor="apptSort">Order</label>
          <select
            id="apptSort"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
          >
            <option value="date_asc">Soonest first</option>
            <option value="date_desc">Latest first</option>
          </select>
        </div>
      </div>

      <div className="appt-filters__row appt-filters__row--statuses">
        <span className="appt-filters__legend">Status</span>
        {APPOINTMENT_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`chip${filters.statuses.includes(status) ? ' chip--on' : ''}`}
            onClick={() => toggleStatus(status)}
            aria-pressed={filters.statuses.includes(status)}
          >
            {formatStatus(status)}
          </button>
        ))}
        {filters.statuses.length > 0 && (
          <button
            type="button"
            className="appt-filters__clear"
            onClick={() => set({ statuses: [] })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
