/**
 * Payers and clearinghouses are global reference data owned by super admins — the
 * practice side only reads them. These mirror the shapes the /api/admin/payer
 * endpoint accepts so the forms and the API agree on field names.
 */

/** Free-text columns, in the order the create form lays them out. */
export const PAYER_TEXT_FIELDS = ['name', 'claims_address', 'phone', 'portal_url'];

export const PAYER_BOOLEAN_FIELDS = [
  'supports_eligibility',
  'supports_claims',
  'supports_era',
  'enrollment_required',
  'active',
];

/** The transactions a payer can accept — shown together as one row of toggles. */
export const PAYER_CAPABILITIES = [
  { field: 'supports_eligibility', label: 'Eligibility' },
  { field: 'supports_claims', label: 'Claims' },
  { field: 'supports_era', label: 'ERA' },
];

/**
 * A payer_id only means something next to the clearinghouse that issued it, so a
 * new payer is always filed under one. Booleans default to how the API defaults
 * them: capabilities off, active on.
 */
export const EMPTY_PAYER = {
  clearinghouse_id: '',
  payer_id: '',
  name: '',
  aliases: '',
  claims_address: '',
  phone: '',
  portal_url: '',
  supports_eligibility: false,
  supports_claims: false,
  supports_era: false,
  enrollment_required: false,
  active: true,
};

/** Aliases are stored as an array but edited as one comma-separated line. */
export function aliasesToInput(aliases) {
  return (aliases || []).join(', ');
}

export function parseAliases(value) {
  return value
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean);
}

/** Builds form state from an API payer record. Text stays string, booleans stay bool. */
export function toPayerForm(payer) {
  const form = {
    clearinghouse_id: payer?.clearinghouse_id || '',
    payer_id: payer?.payer_id || '',
    aliases: aliasesToInput(payer?.aliases),
  };
  for (const field of PAYER_TEXT_FIELDS) {
    form[field] = payer?.[field] || '';
  }
  for (const field of PAYER_BOOLEAN_FIELDS) {
    form[field] = Boolean(payer?.[field]);
  }
  return form;
}

/**
 * Returns only the fields the user actually changed — PATCH takes partial bodies,
 * and sending an untouched field would re-send a stale value read before someone
 * else's edit. Blank text is sent through so a field can be cleared; the API
 * stores an empty string as null.
 */
export function changedPayerFields(form, payer) {
  const saved = toPayerForm(payer);
  const patch = {};

  for (const field of ['clearinghouse_id', 'payer_id', ...PAYER_TEXT_FIELDS]) {
    if (form[field].trim() !== saved[field]) {
      patch[field] = form[field].trim();
    }
  }
  if (form.aliases.trim() !== saved.aliases.trim()) {
    patch.aliases = parseAliases(form.aliases);
  }
  for (const field of PAYER_BOOLEAN_FIELDS) {
    if (form[field] !== saved[field]) {
      patch[field] = form[field];
    }
  }

  return patch;
}

/** Strips the empty fields out of a create body so omitted columns keep their defaults. */
export function toPayerCreateBody(form) {
  const body = {
    clearinghouse_id: form.clearinghouse_id,
    payer_id: form.payer_id.trim(),
    name: form.name.trim(),
    aliases: parseAliases(form.aliases),
  };
  for (const field of ['claims_address', 'phone', 'portal_url']) {
    if (form[field].trim()) body[field] = form[field].trim();
  }
  for (const field of PAYER_BOOLEAN_FIELDS) {
    body[field] = form[field];
  }
  if (!body.clearinghouse_id) delete body.clearinghouse_id;
  if (body.aliases.length === 0) delete body.aliases;
  return body;
}

/** Names are lowercased on the way in, so they read better title-cased on the way out. */
export function formatClearinghouse(name) {
  if (!name) return '—';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function capabilityLabels(payer) {
  return PAYER_CAPABILITIES.filter(({ field }) => payer[field]).map(({ label }) => label);
}

/** How a payer reads in a picker: the name people know it by, then the id claims carry. */
export function formatPayerOption(payer) {
  return payer.payer_id ? `${payer.name} - ${payer.payer_id}` : payer.name;
}

/**
 * Turns the payer directory into picker options for a plan's payer_id. Plans store the
 * clearinghouse-issued payer_id, so that is the option value — two directory rows can
 * share one (same payer under two clearinghouses), and the first name wins. `current`
 * is kept as an option even when the directory has no match, so a plan referencing a
 * retired or unlisted payer keeps its value instead of being silently rewritten.
 */
export function payerOptions(payers, current) {
  const options = [];
  const seen = new Set();

  for (const payer of payers) {
    if (!payer.payer_id || seen.has(payer.payer_id)) continue;
    seen.add(payer.payer_id);
    options.push({ value: payer.payer_id, label: formatPayerOption(payer) });
  }
  options.sort((a, b) => a.label.localeCompare(b.label));

  if (current && !seen.has(current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}
