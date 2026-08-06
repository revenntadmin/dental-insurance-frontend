import {
  ACCIDENT_TYPES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_SUGGESTIONS,
  PLACE_OF_SERVICE_CODES,
  formatStatus,
  humanize,
} from '../lib/appointments';
import { providerName } from '../lib/providers';

/**
 * The create and edit forms show the same fields, so they share them.
 *
 * Place of service, prior auth, accident and ortho are 837D claim inputs. They look
 * clinical enough to belong on a chart note, but nothing downstream can reconstruct
 * them: by the time a claim is built, the only record that the visit followed a car
 * accident in March is whatever was captured here.
 */
export default function AppointmentFields({
  form,
  onChange,
  idPrefix,
  providers,
  providersLoading,
}) {
  const id = (field) => `${idPrefix}-${field}`;

  return (
    <>
      <div className="form-field">
        <label htmlFor={id('serviceDate')}>Service date</label>
        <input
          id={id('serviceDate')}
          type="date"
          value={form.service_date}
          onChange={(e) => onChange('service_date', e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('time')}>Time</label>
        <input
          id={id('time')}
          type="time"
          value={form.time}
          onChange={(e) => onChange('time', e.target.value)}
        />
        <span className="form-hint">Optional — a visit can hold a day before it holds a slot.</span>
      </div>

      <div className="form-field">
        <label htmlFor={id('provider')}>Provider</label>
        <select
          id={id('provider')}
          value={form.provider_id}
          onChange={(e) => onChange('provider_id', e.target.value)}
        >
          <option value="">Unassigned</option>
          {providersLoading && <option disabled>Loading...</option>}
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {providerName(provider)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={id('duration')}>Duration (minutes)</label>
        <input
          id={id('duration')}
          type="number"
          min="1"
          step="5"
          value={form.duration_minutes}
          onChange={(e) => onChange('duration_minutes', e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('status')}>Status</label>
        <select
          id={id('status')}
          value={form.status}
          onChange={(e) => onChange('status', e.target.value)}
        >
          {APPOINTMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={id('type')}>Appointment type</label>
        <input
          id={id('type')}
          type="text"
          list={id('type-options')}
          value={form.appointment_type}
          onChange={(e) => onChange('appointment_type', e.target.value)}
        />
        <datalist id={id('type-options')}>
          {APPOINTMENT_TYPE_SUGGESTIONS.map((type) => (
            <option key={type} value={type}>
              {humanize(type)}
            </option>
          ))}
        </datalist>
      </div>

      <div className="form-field form-field--full">
        <label htmlFor={id('reason')}>Reason for visit</label>
        <textarea
          id={id('reason')}
          rows={2}
          value={form.reason_for_visit}
          onChange={(e) => onChange('reason_for_visit', e.target.value)}
        />
      </div>

      <hr className="section-card__divider" />

      <h3 className="section-card__subtitle">Claim details</h3>
      <p className="form-hint">
        These ride along on the 837D. Capture them now — once the visit is over, nothing
        downstream can recover them.
      </p>

      <div className="form-field">
        <label htmlFor={id('pos')}>Place of service</label>
        <select
          id={id('pos')}
          value={form.place_of_service_code}
          onChange={(e) => onChange('place_of_service_code', e.target.value)}
        >
          <option value="">Not set</option>
          {PLACE_OF_SERVICE_CODES.map((pos) => (
            <option key={pos.code} value={pos.code}>
              {pos.code} — {pos.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={id('priorAuth')}>Prior authorization number</label>
        <input
          id={id('priorAuth')}
          type="text"
          value={form.prior_auth_number}
          onChange={(e) => onChange('prior_auth_number', e.target.value)}
        />
      </div>

      <fieldset className="checkbox-group form-field--full">
        <legend>Accident</legend>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.accident_related}
            onChange={(e) => onChange('accident_related', e.target.checked)}
          />
          <span>This visit is accident-related</span>
        </label>
      </fieldset>

      {/*
        Unchecking hides these and the patch clears them server-side: the API validates
        accident coherence against the merged row, so a leftover accident date would
        fail an unrelated edit months later.
      */}
      {form.accident_related && (
        <>
          <div className="form-field">
            <label htmlFor={id('accidentType')}>Accident type</label>
            <select
              id={id('accidentType')}
              value={form.accident_type}
              onChange={(e) => onChange('accident_type', e.target.value)}
              required
            >
              <option value="">Choose one</option>
              {ACCIDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanize(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={id('accidentDate')}>Accident date</label>
            <input
              id={id('accidentDate')}
              type="date"
              value={form.accident_date}
              onChange={(e) => onChange('accident_date', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor={id('accidentState')}>State</label>
            <input
              id={id('accidentState')}
              type="text"
              maxLength={2}
              placeholder="CA"
              value={form.accident_state}
              onChange={(e) => onChange('accident_state', e.target.value.toUpperCase())}
            />
          </div>
        </>
      )}

      <hr className="section-card__divider" />

      <h3 className="section-card__subtitle">Orthodontics</h3>
      <p className="form-hint">
        Only for banded ortho. Payers prorate the contract by the months already
        delivered, so the placement date and month counts decide what gets paid.
      </p>

      <div className="form-field">
        <label htmlFor={id('orthoPlaced')}>Appliance placed on</label>
        <input
          id={id('orthoPlaced')}
          type="date"
          value={form.ortho_appliance_placed_on}
          onChange={(e) => onChange('ortho_appliance_placed_on', e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('orthoTotal')}>Months of treatment</label>
        <input
          id={id('orthoTotal')}
          type="number"
          min="0"
          value={form.ortho_months_total}
          onChange={(e) => onChange('ortho_months_total', e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('orthoRemaining')}>Months remaining</label>
        <input
          id={id('orthoRemaining')}
          type="number"
          min="0"
          value={form.ortho_months_remaining}
          onChange={(e) => onChange('ortho_months_remaining', e.target.value)}
        />
      </div>
    </>
  );
}
