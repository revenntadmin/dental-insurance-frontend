/** Date-ish columns come back as ISO strings but `<input type="date">` needs YYYY-MM-DD. */
function isDateField(field) {
  return field === 'dob' || field.endsWith('_dob') || field.endsWith('_date');
}

export function toDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function formatDate(value) {
  const iso = toDateInput(value);
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
}

/** Builds form state (all strings) for `fields` from an API record. */
export function toFormValues(record, fields) {
  return fields.reduce((values, field) => {
    const raw = isDateField(field) ? toDateInput(record?.[field]) : record?.[field];
    values[field] = raw || '';
    return values;
  }, {});
}

/**
 * Returns only the fields whose form value differs from the saved record — the
 * API endpoints take partial updates, so sending untouched fields would let one
 * section overwrite another's data.
 */
export function changedFields(form, record, fields) {
  const saved = toFormValues(record, fields);
  return fields.reduce((patch, field) => {
    if (form[field].trim() !== saved[field]) {
      patch[field] = form[field].trim();
    }
    return patch;
  }, {});
}
