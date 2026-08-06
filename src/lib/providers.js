import { changedFields } from './forms';

/**
 * Rendering providers belong to the practice, not to a login — a hygienist may have
 * no account and an office manager is never a rendering provider — so they are their
 * own record rather than a column on the user.
 */

/** Mirrors the /api/provider endpoint's updatable fields. */
export const PROVIDER_FIELDS = ['name', 'npi', 'specialty'];

/**
 * An NPI is ten digits. The API checks the shape only, so this does too: the last
 * digit is a Luhn check digit, but validating it here would reject numbers the API
 * accepts and leave the user unable to save a provider the server is happy with.
 */
const NPI_PATTERN = /^\d{10}$/;

/** Returns the first problem with the form, or '' when it is safe to submit. */
export function validateProvider(form) {
  if (!form.name.trim()) return 'Provider name is required.';
  const npi = form.npi.trim();
  if (npi && !NPI_PATTERN.test(npi)) return 'NPI must be exactly 10 digits.';
  return '';
}

/** Strips the blank optional fields out of a create body so they stay unset. */
export function toProviderCreateBody(form) {
  const body = { name: form.name.trim() };
  for (const field of ['npi', 'specialty']) {
    if (form[field].trim()) body[field] = form[field].trim();
  }
  return body;
}

/**
 * Only the fields the user actually changed — PATCH takes partial bodies. A cleared
 * optional field goes as null, which is how the API unsets it; name is never nulled
 * because the API requires it non-empty, and validateProvider blocks that first.
 */
export function providerPatch(form, provider) {
  const patch = changedFields(form, provider, PROVIDER_FIELDS);
  for (const field of ['npi', 'specialty']) {
    if (patch[field] === '') patch[field] = null;
  }
  return patch;
}

/** Alphabetical by name, so a saved rename lands where the list already reads. */
export function sortProviders(providers) {
  return [...providers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Rows created before the API required a name can still come back without one — the
 * column is nullable — so every read site needs a fallback.
 */
export function providerName(provider) {
  return provider?.name || 'Unnamed provider';
}
