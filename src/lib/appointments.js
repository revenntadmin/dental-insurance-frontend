/**
 * Appointments are the unit of work for eligibility: a 270 is run against a visit's
 * service date, not against "today", so everything here keeps the service date as the
 * anchor and treats the clock only as a display detail.
 */

/** The API rejects anything outside this list. */
export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'checked_in',
  'completed',
  'no_show',
  'cancelled',
];

/**
 * Ordered loudest first — the same order the API uses when it collapses a patient's
 * plans into one appointment status, so a row's badge is always the worst answer
 * across their coverage rather than the primary's.
 */
export const VERIFICATION_STATUSES = [
  'no_plan',
  'error',
  'inactive',
  'stale',
  'unverified',
  'verified',
];

/** verify_batch takes at most this many appointments per request. */
export const MAX_BATCH_VERIFY = 50;

/** The list endpoint's page size. 200 is the API's ceiling; 50 is its default. */
export const PAGE_SIZE = 50;

/** Default staleness window, in days, matching the API's own default. */
export const DEFAULT_FRESH_DAYS = 30;

/**
 * Types are free text on the API — practices name their columns differently — so this
 * seeds the picker rather than constraining it. Values actually in use are merged in
 * from the loaded rows by `appointmentTypeOptions`.
 */
export const APPOINTMENT_TYPE_SUGGESTIONS = [
  'preventive',
  'restorative',
  'endodontic',
  'periodontic',
  'prosthodontic',
  'oral_surgery',
  'orthodontic',
  'implant',
  'emergency',
  'consultation',
];

/** The POS codes a dental practice actually bills; 11 (Office) covers almost everything. */
export const PLACE_OF_SERVICE_CODES = [
  { code: '11', label: 'Office' },
  { code: '12', label: 'Home' },
  { code: '03', label: 'School' },
  { code: '04', label: 'Homeless shelter' },
  { code: '21', label: 'Inpatient hospital' },
  { code: '22', label: 'On-campus outpatient hospital' },
  { code: '23', label: 'Emergency room' },
  { code: '31', label: 'Skilled nursing facility' },
  { code: '32', label: 'Nursing facility' },
  { code: '99', label: 'Other' },
];

/** X12 accident causes (CLM11-1). */
export const ACCIDENT_TYPES = ['auto', 'employment', 'other'];

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  no_show: 'No show',
  cancelled: 'Cancelled',
};

const VERIFICATION_LABELS = {
  no_plan: 'No plan',
  error: 'Check failed',
  inactive: 'Inactive',
  stale: 'Stale',
  unverified: 'Not checked',
  verified: 'Verified',
};

/**
 * What the badge is asking the user to do. no_plan and error are the two that a retry
 * cannot clear — they need someone to add coverage or read the payer's complaint.
 */
const VERIFICATION_HINTS = {
  no_plan: 'No coverage on file. Add a plan — re-checking cannot fix this.',
  error: 'The last check failed. Read the error before retrying.',
  inactive: 'The payer says coverage is not active on the service date.',
  stale: 'Last checked outside the freshness window. Re-verify before the visit.',
  unverified: 'No check has been run for this visit yet.',
  verified: 'Active coverage confirmed inside the freshness window.',
};

/** `oral_surgery` → `Oral surgery`. Unknown values still read like words. */
export function humanize(value) {
  if (!value) return '';
  const words = String(value).replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatStatus(status) {
  return STATUS_LABELS[status] || humanize(status) || 'Unknown';
}

export function formatVerification(status) {
  return VERIFICATION_LABELS[status] || humanize(status) || 'Unknown';
}

export function verificationHint(status) {
  return VERIFICATION_HINTS[status] || '';
}

/**
 * no_plan and error get the alarm treatment because neither resolves itself: one is
 * missing data, the other is a payer rejecting the request as sent.
 */
export function verificationBadgeClass(status) {
  if (status === 'no_plan' || status === 'error') return 'verify-badge--alarm';
  if (status === 'inactive' || status === 'stale') return 'verify-badge--warn';
  if (status === 'verified') return 'verify-badge--ok';
  return 'verify-badge--muted';
}

/** True for the states a human has to resolve rather than re-run. */
export function needsHuman(status) {
  return status === 'no_plan' || status === 'error';
}

/** Verifying a visit with no coverage on file is a guaranteed 409. */
export function canVerify(appointment) {
  return appointment?.verification_status !== 'no_plan';
}

function pad(value) {
  return String(value).padStart(2, '0');
}

/** Local calendar date, not UTC — a 7pm appointment must not land on tomorrow. */
export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The grid opens on the fortnight ahead — the window a practice can still act on. */
export function defaultRange() {
  const from = todayIso();
  return { from, to: addDays(from, 13) };
}

/** Parses YYYY-MM-DD as a local date; `new Date(iso)` would read it as UTC midnight. */
function localDate(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayHeading(iso) {
  if (!iso) return 'Unscheduled';
  const date = localDate(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const today = todayIso();
  const prefix = iso === today ? 'Today · ' : iso === addDays(today, 1) ? 'Tomorrow · ' : '';
  return (
    prefix
    + date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  );
}

/** An appointment may hold a service date without a time; the column then reads "—". */
export function formatTime(scheduledAt) {
  if (!scheduledAt) return '—';
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

/**
 * Days keep the order the API sorted them into, so flipping to date_desc reorders the
 * headings too rather than only the rows inside them.
 */
export function groupByDay(appointments) {
  const days = [];
  const index = new Map();

  for (const appointment of appointments) {
    const date = appointment.service_date || '';
    if (!index.has(date)) {
      const group = { date, appointments: [] };
      index.set(date, group);
      days.push(group);
    }
    index.get(date).appointments.push(appointment);
  }

  return days;
}

/** The suggestions plus whatever the practice actually books, so no filter option is missing. */
export function appointmentTypeOptions(appointments) {
  const seen = appointments.map((appointment) => appointment.appointment_type).filter(Boolean);
  return [...new Set([...APPOINTMENT_TYPE_SUGGESTIONS, ...seen])].sort();
}

/* -------------------------------------------------------------------------- */
/* Form state                                                                  */
/* -------------------------------------------------------------------------- */

/** Text fields that go out trimmed, or as null once cleared. */
const TEXT_FIELDS = [
  'provider_id',
  'status',
  'appointment_type',
  'reason_for_visit',
  'place_of_service_code',
  'prior_auth_number',
  'accident_type',
  'accident_state',
];

const NUMBER_FIELDS = ['duration_minutes', 'ortho_months_total', 'ortho_months_remaining'];

const DATE_FIELDS = ['accident_date', 'ortho_appliance_placed_on'];

export const EMPTY_APPOINTMENT_FORM = {
  service_date: '',
  time: '',
  provider_id: '',
  duration_minutes: '',
  status: 'scheduled',
  appointment_type: '',
  reason_for_visit: '',
  place_of_service_code: '11',
  prior_auth_number: '',
  accident_related: false,
  accident_type: '',
  accident_date: '',
  accident_state: '',
  ortho_appliance_placed_on: '',
  ortho_months_total: '',
  ortho_months_remaining: '',
};

function timeInputValue(scheduledAt) {
  if (!scheduledAt) return '';
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The API carries one timestamp plus a derived date; the form splits them because the
 * grid is a day grid and a visit may be booked to a day before it has a slot.
 */
export function toAppointmentForm(appointment) {
  if (!appointment) return { ...EMPTY_APPOINTMENT_FORM, service_date: todayIso() };

  const form = { ...EMPTY_APPOINTMENT_FORM };
  form.service_date = String(appointment.service_date || '').slice(0, 10);
  form.time = timeInputValue(appointment.scheduled_at);
  form.accident_related = Boolean(appointment.accident_related);

  for (const field of [...TEXT_FIELDS, ...NUMBER_FIELDS]) {
    form[field] = appointment[field] === null || appointment[field] === undefined
      ? ''
      : String(appointment[field]);
  }
  for (const field of DATE_FIELDS) {
    form[field] = String(appointment[field] || '').slice(0, 10);
  }

  return form;
}

/** Local wall-clock date + time as an instant. Returns null when no time was given. */
export function combineDateTime(date, time) {
  if (!date || !time) return null;
  const combined = new Date(`${date}T${time}`);
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

/** Returns the first problem with the form, or '' when it is safe to submit. */
export function validateAppointment(form) {
  if (!form.service_date) return 'A service date is required.';

  if (form.duration_minutes && Number(form.duration_minutes) <= 0) {
    return 'Duration must be greater than zero.';
  }

  if (form.accident_related && !form.accident_type) {
    return 'Choose what kind of accident this was.';
  }

  const total = form.ortho_months_total === '' ? null : Number(form.ortho_months_total);
  const remaining = form.ortho_months_remaining === '' ? null : Number(form.ortho_months_remaining);
  if (total !== null && remaining !== null && remaining > total) {
    return 'Months remaining cannot exceed the total treatment months.';
  }

  return '';
}

/**
 * The full body the form describes, with cleared fields as null. Accident details are
 * dropped whenever the visit is not accident-related: the API validates the merged row
 * for coherence, so leaving a stale accident date behind would fail a later patch that
 * never touched it.
 */
function appointmentBody(form) {
  const body = {
    service_date: form.service_date || null,
    scheduled_at: combineDateTime(form.service_date, form.time),
    accident_related: Boolean(form.accident_related),
  };

  for (const field of TEXT_FIELDS) {
    body[field] = form[field]?.trim() ? form[field].trim() : null;
  }
  for (const field of NUMBER_FIELDS) {
    body[field] = form[field] === '' || form[field] === null ? null : Number(form[field]);
  }
  for (const field of DATE_FIELDS) {
    body[field] = form[field] || null;
  }

  if (!body.accident_related) {
    body.accident_type = null;
    body.accident_date = null;
    body.accident_state = null;
  }

  return body;
}

/** Create bodies leave unset fields out entirely rather than sending explicit nulls. */
export function toAppointmentCreateBody(form, patientId) {
  const body = appointmentBody(form);
  const payload = { patient_id: patientId };

  for (const [field, value] of Object.entries(body)) {
    if (value === null) continue;
    if (field === 'accident_related' && value === false) continue;
    payload[field] = value;
  }

  return payload;
}

/**
 * Only what the user changed — PATCH takes partial bodies, and patient_id is not
 * patchable at all (re-pointing a visit would orphan its procedures and checks).
 *
 * Date and time are diffed as the form holds them rather than as instants: a stored
 * timestamp carrying seconds would otherwise re-serialize differently every save.
 */
export function appointmentPatch(form, appointment) {
  const saved = toAppointmentForm(appointment);
  const next = appointmentBody(form);
  const previous = appointmentBody(saved);
  const patch = {};

  if (form.service_date !== saved.service_date || form.time !== saved.time) {
    patch.service_date = next.service_date;
    patch.scheduled_at = next.scheduled_at;
  }

  for (const field of Object.keys(next)) {
    if (field === 'service_date' || field === 'scheduled_at') continue;
    if (next[field] !== previous[field]) patch[field] = next[field];
  }

  return patch;
}

/**
 * verify and verify_batch report per-plan outcomes in place instead of failing the
 * request, so a two-plan patient comes back with two independent answers.
 */
export function verifyOutcome(result) {
  if (!result) return { total: 0, failed: 0, ok: 0 };
  const plans = result.results || [];
  const failed = plans.filter((plan) => !plan.ok).length;
  return { total: plans.length, failed, ok: plans.length - failed };
}

/** verify_batch's envelope is not documented as a bare array, so accept either. */
export function batchResults(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.appointments || [];
}
