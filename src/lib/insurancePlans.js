/** Mirrors the insurance-plan endpoint's updatable fields. */
export const PLAN_FIELDS = [
  'coordination_order',
  'plan_type',
  'payer_id',
  'member_id',
  'group_number',
  'effective_date',
  'subscriber_first_name',
  'subscriber_middle_name',
  'subscriber_last_name',
  'subscriber_dob',
  'subscriber_relationship',
];

/** The name parts the API stores separately but every read site shows as one string. */
export const SUBSCRIBER_NAME_FIELDS = [
  'subscriber_first_name',
  'subscriber_middle_name',
  'subscriber_last_name',
];

/**
 * payer_name_reported is insert-only — it records what the source called the payer.
 * Afterwards `payer_name` is resolved from the payer directory by payer_id, so
 * correcting a payer means fixing payer_id rather than retyping the name.
 */
export const PLAN_CREATE_FIELDS = [...PLAN_FIELDS, 'payer_name_reported'];

/** Coverage is worked primary first; the API rejects anything outside this list. */
export const COORDINATION_ORDERS = ['primary', 'secondary', 'tertiary'];

/** The patient's relationship TO the subscriber (X12 SBR02). */
export const SUBSCRIBER_RELATIONSHIPS = ['self', 'spouse', 'child', 'other'];

function titleCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export function formatCoordinationOrder(order) {
  return titleCase(order) || 'Unassigned';
}

export function formatRelationship(relationship) {
  return titleCase(relationship);
}

/** The subscriber's name as one line; missing parts (usually middle) drop out. */
export function subscriberName(plan) {
  return SUBSCRIBER_NAME_FIELDS.map((field) => plan?.[field]).filter(Boolean).join(' ');
}

/**
 * PATCH bodies carry null, not '', for fields the user cleared. The API trims and
 * nulls empty strings anyway, but null says what the request actually means.
 */
export function nullBlanks(patch) {
  return Object.fromEntries(
    Object.entries(patch).map(([field, value]) => [field, value === '' ? null : value]),
  );
}

export function planTitle(plan) {
  const order = formatCoordinationOrder(plan?.coordination_order);
  return `${order} insurance`;
}

/** Keeps the API's primary → secondary → tertiary ordering after a local edit. */
export function sortPlans(plans) {
  const rank = (plan) => {
    const index = COORDINATION_ORDERS.indexOf(plan.coordination_order);
    return index === -1 ? COORDINATION_ORDERS.length : index;
  };
  return [...plans].sort((a, b) => rank(a) - rank(b));
}

/**
 * A patient can hold only one plan per coordination order — the API returns 409
 * otherwise, so keep taken slots out of the picker. `currentOrder` stays available
 * so a plan being edited can keep its own slot.
 */
export function availableOrders(plans, currentOrder) {
  const taken = new Set(plans.map((plan) => plan.coordination_order));
  return COORDINATION_ORDERS.filter((order) => order === currentOrder || !taken.has(order));
}
