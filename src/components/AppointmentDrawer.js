import { useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiClient';
import AppointmentFields from './AppointmentFields';
import EditableSection from './EditableSection';
import VerificationBadge from './VerificationBadge';
import VerifyResults from './VerifyResults';
import { useProviders } from '../hooks/useProviders';
import { getErrorMessage } from '../lib/apiError';
import {
  appointmentPatch,
  canVerify,
  formatDayHeading,
  formatDateTime,
  formatMoney,
  formatStatus,
  formatTime,
  humanize,
  toAppointmentForm,
  validateAppointment,
  verificationHint,
} from '../lib/appointments';
import { formatDate } from '../lib/forms';
import { formatCoordinationOrder } from '../lib/insurancePlans';
import { patientName } from '../lib/patients';

function Fact({ label, children }) {
  return (
    <div className="fact">
      <span className="fact__label">{label}</span>
      <span className="fact__value">{children ?? '—'}</span>
    </div>
  );
}

/**
 * Everything about one visit, over the grid rather than on its own page: the person
 * reading it is working a list and needs to get back to it.
 *
 * Cancel and delete are deliberately different actions. Cancelling is a status change
 * and keeps the visit, its procedures and its checks — which is what "the patient is
 * not coming" actually means. Deleting is for a visit that should never have been
 * booked, and the API refuses it outright once anything hangs off the row.
 */
export default function AppointmentDrawer({ appointmentId, onClose, onUpdated, onDeleted }) {
  const { providers, loading: providersLoading } = useProviders();

  const [appointment, setAppointment] = useState(null);
  const [form, setForm] = useState(() => toAppointmentForm(null));
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [actionError, setActionError] = useState('');
  const [confirming, setConfirming] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function applyAppointment(data) {
    setAppointment(data);
    setForm(toAppointmentForm(data));
  }

  /**
   * The checks actually run against this visit — not the "latest check per plan" the
   * grid derives. Answers for an appointment the drawer has already moved off are
   * dropped, so a slow response cannot land under someone else's visit.
   */
  const shownIdRef = useRef(appointmentId);
  shownIdRef.current = appointmentId;

  function loadChecks() {
    const requestedId = appointmentId;
    return apiClient
      .get(`/api/appointment/${requestedId}/eligibility`)
      .then(({ data }) => {
        if (shownIdRef.current !== requestedId) return;
        setChecks(Array.isArray(data) ? data : data?.results || []);
      })
      .catch(() => {
        if (shownIdRef.current === requestedId) setChecks([]);
      });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setVerifyResult(null);
    setVerifyError('');
    setConfirming('');

    apiClient
      .get(`/api/appointment/${appointmentId}`)
      .then(({ data }) => {
        if (!cancelled) applyAppointment(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load appointment'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    loadChecks();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveVisit() {
    const problem = validateAppointment(form);
    if (problem) throw new Error(problem);

    const patch = appointmentPatch(form, appointment);
    if (Object.keys(patch).length === 0) {
      return 'No changes to save.';
    }

    const { data } = await apiClient.patch(`/api/appointment/${appointmentId}`, patch);
    applyAppointment(data);
    onUpdated(data);
    return 'Appointment updated.';
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyError('');
    try {
      const { data } = await apiClient.post(`/api/appointment/${appointmentId}/verify`);
      setVerifyResult(data);

      // The badge is derived per request, so the row has to be re-read to move.
      const { data: refreshed } = await apiClient.get(`/api/appointment/${appointmentId}`);
      applyAppointment(refreshed);
      onUpdated(refreshed);
      await loadChecks();
    } catch (err) {
      setVerifyError(getErrorMessage(err, 'Failed to run the eligibility check'));
    } finally {
      setVerifying(false);
    }
  }

  async function handleCancelVisit() {
    setActionError('');
    setWorking(true);
    try {
      const { data } = await apiClient.patch(`/api/appointment/${appointmentId}`, {
        status: 'cancelled',
      });
      applyAppointment(data);
      onUpdated(data);
      setConfirming('');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to cancel the appointment'));
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    setActionError('');
    setWorking(true);
    try {
      await apiClient.delete(`/api/appointment/${appointmentId}`);
      onDeleted(appointmentId);
      onClose();
    } catch (err) {
      // 409 means procedures, claims or checks hang off this visit — cancelling is the
      // action the user actually wants, so say so rather than repeating the raw error.
      const message =
        err.response?.status === 409
          ? 'This visit has procedures, claims or eligibility checks attached, so it cannot be deleted. Cancel it instead — that keeps the record and its history.'
          : getErrorMessage(err, 'Failed to delete the appointment');
      setActionError(message);
      setConfirming('');
    } finally {
      setWorking(false);
    }
  }

  const plans = appointment?.insurance_plans || [];
  const procedures = appointment?.procedures || [];
  const cancelled = appointment?.status === 'cancelled';

  return (
    <div className="drawer">
      <div className="drawer__backdrop" onClick={onClose} role="presentation" />

      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-label="Appointment detail">
        <header className="drawer__header">
          <div>
            <h2 className="drawer__title">
              {loading ? 'Loading...' : patientName(appointment?.patient)}
            </h2>
            {appointment && (
              <>
                <p className="drawer__subtitle">
                  {formatDayHeading(appointment.service_date)}
                  {appointment.scheduled_at ? ` · ${formatTime(appointment.scheduled_at)}` : ''}
                  {' · '}
                  {formatStatus(appointment.status)}
                </p>
                {/* DOB is how a payer identifies the patient, so it belongs beside the name. */}
                <p className="drawer__subtitle">
                  DOB {formatDate(appointment.patient?.dob)}
                  {appointment.patient?.phone ? ` · ${appointment.patient.phone}` : ''}
                </p>
              </>
            )}
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="drawer__body">
          {error && <p className="form-error">{error}</p>}

          {appointment && (
            <>
              <section className="section-card section-card--full">
                <div className="section-card__header">
                  <div className="plan-heading">
                    <h3 className="section-card__title">Coverage</h3>
                    <VerificationBadge status={appointment.verification_status} />
                  </div>
                  <button
                    type="button"
                    className="section-card__edit"
                    onClick={handleVerify}
                    disabled={verifying || !canVerify(appointment)}
                  >
                    {verifying ? 'Checking...' : 'Verify now'}
                  </button>
                </div>

                <p className="form-hint">{verificationHint(appointment.verification_status)}</p>

                {verifyError && <p className="form-error section-card__message">{verifyError}</p>}
                <VerifyResults result={verifyResult} onDismiss={() => setVerifyResult(null)} />

                {plans.length === 0 ? (
                  <p className="form-hint">
                    No insurance on file for this patient. Add a plan on their record — a check
                    cannot be run without one.
                  </p>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.id} className="drawer__plan">
                      <div className="plan-heading">
                        <span className={`plan-badge plan-badge--${plan.coordination_order}`}>
                          {formatCoordinationOrder(plan.coordination_order)}
                        </span>
                        <span className="plan-heading__payer">{plan.payer_name}</span>
                        <VerificationBadge status={plan.verification_status} size="small" />
                      </div>

                      <div className="fact-grid">
                        <Fact label="Member ID">{plan.member_id}</Fact>
                        <Fact label="Coverage">{humanize(plan.coverage_status)}</Fact>
                        <Fact label="Checked">{formatDateTime(plan.checked_at)}</Fact>
                        <Fact label="Deductible left">
                          {formatMoney(plan.deductible_remaining)}
                        </Fact>
                        <Fact label="Annual max left">
                          {formatMoney(plan.annual_max_remaining)}
                        </Fact>
                        {plan.error_code && <Fact label="Error">{plan.error_code}</Fact>}
                      </div>
                    </div>
                  ))
                )}
              </section>

              <EditableSection
                title="Visit"
                description="Place of service, prior auth, accident and ortho details go out on the 837D."
                bodyClassName=""
                onSave={saveVisit}
                onCancel={() => setForm(toAppointmentForm(appointment))}
              >
                {({ editing }) => (
                  // One fieldset rather than a `disabled` prop per control: the visit form
                  // has twenty of them, and the accident block appears and disappears.
                  <fieldset
                    className="drawer__fieldset form-grid form-grid--full"
                    disabled={!editing}
                  >
                    <AppointmentFields
                      form={form}
                      onChange={updateField}
                      idPrefix={`appt-${appointment.id}`}
                      providers={providers}
                      providersLoading={providersLoading}
                    />
                  </fieldset>
                )}
              </EditableSection>

              <section className="section-card section-card--full">
                <div className="section-card__header">
                  <h3 className="section-card__title">Procedures</h3>
                </div>

                {procedures.length === 0 ? (
                  <p className="form-hint">No procedures recorded on this visit.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Tooth / surface</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Billing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procedures.map((procedure) => (
                        <tr key={procedure.id}>
                          <td>
                            <span className="data-table__mono">{procedure.cdt_code}</span>
                            {procedure.cdt_code_source && (
                              <span className="appt-row__meta">
                                {humanize(procedure.cdt_code_source)}
                              </span>
                            )}
                          </td>
                          <td>
                            {[procedure.tooth_number, procedure.surface, procedure.quadrant]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </td>
                          <td>{formatMoney(procedure.fee)}</td>
                          <td>{humanize(procedure.status) || '—'}</td>
                          <td>{humanize(procedure.billing_status) || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="section-card section-card--full">
                <div className="section-card__header">
                  <h3 className="section-card__title">Eligibility history</h3>
                </div>
                <p className="form-hint">
                  Checks run against this visit, newest first.
                </p>

                {checks.length === 0 ? (
                  <p className="form-hint">Nothing has been checked for this visit yet.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Checked</th>
                        <th>Payer</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checks.map((check, index) => (
                        <tr key={check.id || index}>
                          <td>{formatDateTime(check.checked_at || check.created_at)}</td>
                          <td>{check.payer_name || '—'}</td>
                          <td>
                            {check.error_message || check.error_code ? (
                              <span className="verify-results__failed">
                                {check.error_message || check.error_code}
                              </span>
                            ) : (
                              <span
                                className={`status-badge ${
                                  check.coverage_active ? 'status-badge--active' : 'status-badge--inactive'
                                }`}
                              >
                                {check.coverage_active ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="section-card section-card--full">
                <div className="section-card__header">
                  <h3 className="section-card__title">Scheduling</h3>
                </div>

                <p className="form-hint">
                  Cancelling keeps the visit and everything recorded against it. Deleting is only
                  for a visit that should never have been booked.
                </p>

                {actionError && <p className="form-error section-card__message">{actionError}</p>}

                <div className="section-card__actions">
                  {confirming === 'cancel' ? (
                    <>
                      <span className="section-card__confirm">
                        Mark this appointment cancelled?
                      </span>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={handleCancelVisit}
                        disabled={working}
                      >
                        {working ? 'Cancelling...' : 'Yes, cancel it'}
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => setConfirming('')}
                        disabled={working}
                      >
                        Keep
                      </button>
                    </>
                  ) : confirming === 'delete' ? (
                    <>
                      <span className="section-card__confirm">
                        Erase this visit completely? This cannot be undone.
                      </span>
                      <button
                        type="button"
                        className="button-danger"
                        onClick={handleDelete}
                        disabled={working}
                      >
                        {working ? 'Deleting...' : 'Yes, delete it'}
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => setConfirming('')}
                        disabled={working}
                      >
                        Keep
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirming('cancel')}
                        disabled={cancelled}
                      >
                        {cancelled ? 'Already cancelled' : 'Cancel appointment'}
                      </button>
                      <button
                        type="button"
                        className="button-danger section-card__delete"
                        onClick={() => setConfirming('delete')}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
