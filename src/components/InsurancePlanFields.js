import { useMemo } from 'react';
import {
  SUBSCRIBER_RELATIONSHIPS,
  formatCoordinationOrder,
  formatRelationship,
} from '../lib/insurancePlans';
import { payerOptions } from '../lib/payers';

/**
 * The plan field grid, shared by the edit and create cards. `idPrefix` keeps input
 * ids unique when several plan cards are on the page.
 */
export default function InsurancePlanFields({
  form,
  onChange,
  disabled = false,
  idPrefix,
  orderOptions,
  creating = false,
  payerName,
  payerNameReported,
  payers = [],
  payersLoading = false,
  payersError = '',
}) {
  const id = (name) => `${idPrefix}-${name}`;
  const payerChoices = useMemo(() => payerOptions(payers, form.payer_id), [payers, form.payer_id]);

  return (
    <>
      <div className="form-field">
        <label htmlFor={id('order')}>Coordination order</label>
        <select
          id={id('order')}
          value={form.coordination_order}
          onChange={(e) => onChange('coordination_order', e.target.value)}
          disabled={disabled}
          required
        >
          {orderOptions.map((order) => (
            <option key={order} value={order}>
              {formatCoordinationOrder(order)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={id('planType')}>Plan type</label>
        <input
          id={id('planType')}
          type="text"
          value={form.plan_type}
          onChange={(e) => onChange('plan_type', e.target.value)}
          disabled={disabled}
          placeholder="PPO, HMO, …"
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('payerId')}>Payer</label>
        {payersError ? (
          // Directory unreachable: fall back to typing the id so a payer fix is
          // never blocked by reference data being down.
          <>
            <input
              id={id('payerId')}
              type="text"
              value={form.payer_id}
              onChange={(e) => onChange('payer_id', e.target.value)}
              disabled={disabled}
              placeholder="Payer ID"
            />
            <p className="form-hint">{payersError} Enter the payer ID directly.</p>
          </>
        ) : (
          <>
            <select
              id={id('payerId')}
              value={form.payer_id}
              onChange={(e) => onChange('payer_id', e.target.value)}
              disabled={disabled || payersLoading}
            >
              <option value="">{payersLoading ? 'Loading payers...' : 'Not specified'}</option>
              {payerChoices.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="form-hint">Listed as payer name - payer ID.</p>
          </>
        )}
      </div>

      {creating ? (
        <div className="form-field">
          <label htmlFor={id('payerNameReported')}>Payer name</label>
          <input
            id={id('payerNameReported')}
            type="text"
            value={form.payer_name_reported}
            onChange={(e) => onChange('payer_name_reported', e.target.value)}
          />
          <p className="form-hint">
            Kept as reported. Once the payer ID matches the directory, that payer&apos;s current
            name is shown instead.
          </p>
        </div>
      ) : (
        <div className="form-field">
          <label htmlFor={id('payerName')}>Payer name</label>
          <input id={id('payerName')} type="text" value={payerName || ''} disabled />
          {payerNameReported && payerNameReported !== payerName && (
            <p className="form-hint">Reported as “{payerNameReported}”</p>
          )}
        </div>
      )}

      <div className="form-field">
        <label htmlFor={id('memberId')}>Member ID</label>
        <input
          id={id('memberId')}
          type="text"
          value={form.member_id}
          onChange={(e) => onChange('member_id', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('groupNumber')}>Group number</label>
        <input
          id={id('groupNumber')}
          type="text"
          value={form.group_number}
          onChange={(e) => onChange('group_number', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('effectiveDate')}>Effective date</label>
        <input
          id={id('effectiveDate')}
          type="date"
          value={form.effective_date}
          onChange={(e) => onChange('effective_date', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label htmlFor={id('subscriberRelationship')}>Patient is the subscriber&apos;s</label>
        <select
          id={id('subscriberRelationship')}
          value={form.subscriber_relationship}
          onChange={(e) => onChange('subscriber_relationship', e.target.value)}
          disabled={disabled}
        >
          <option value="">Not specified</option>
          {SUBSCRIBER_RELATIONSHIPS.map((relationship) => (
            <option key={relationship} value={relationship}>
              {formatRelationship(relationship)}
            </option>
          ))}
        </select>
      </div>

      <div className="name-group">
        <div className="form-field">
          <label htmlFor={id('subscriberFirstName')}>Subscriber first name</label>
          <input
            id={id('subscriberFirstName')}
            type="text"
            value={form.subscriber_first_name}
            onChange={(e) => onChange('subscriber_first_name', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="form-field">
          <label htmlFor={id('subscriberMiddleName')}>Middle</label>
          <input
            id={id('subscriberMiddleName')}
            type="text"
            value={form.subscriber_middle_name}
            onChange={(e) => onChange('subscriber_middle_name', e.target.value)}
            disabled={disabled}
          />
          <p className="form-hint">Optional</p>
        </div>

        <div className="form-field">
          <label htmlFor={id('subscriberLastName')}>Subscriber last name</label>
          <input
            id={id('subscriberLastName')}
            type="text"
            value={form.subscriber_last_name}
            onChange={(e) => onChange('subscriber_last_name', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor={id('subscriberDob')}>Subscriber date of birth</label>
        <input
          id={id('subscriberDob')}
          type="date"
          value={form.subscriber_dob}
          onChange={(e) => onChange('subscriber_dob', e.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
}
