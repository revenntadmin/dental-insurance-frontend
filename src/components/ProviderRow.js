import { useState } from 'react';
import apiClient from '../api/apiClient';
import { getErrorMessage } from '../lib/apiError';
import { toFormValues } from '../lib/forms';
import {
  PROVIDER_FIELDS,
  providerName,
  providerPatch,
  validateProvider,
} from '../lib/providers';

/**
 * One provider in the list. Editing happens in place — the cells swap to inputs —
 * so the list stays the only view of the practice's providers.
 */
export default function ProviderRow({ provider, canEdit, columnCount, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toFormValues(provider, PROVIDER_FIELDS));
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing() {
    setError('');
    setMessage('');
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toFormValues(provider, PROVIDER_FIELDS));
    setError('');
    setMessage('');
    setConfirmingDelete(false);
    setEditing(false);
  }

  async function handleSave() {
    const problem = validateProvider(form);
    if (problem) {
      setError(problem);
      return;
    }

    const patch = providerPatch(form, provider);
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      setMessage('No changes to save.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.patch(`/api/provider/${provider.id}`, patch);
      setForm(toFormValues(data, PROVIDER_FIELDS));
      setEditing(false);
      setMessage('Provider updated.');
      onSaved(data);
    } catch (err) {
      // A 409 means another provider in the practice already holds this NPI.
      setError(getErrorMessage(err, 'Failed to save provider'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setError('');
    setSubmitting(true);
    try {
      await apiClient.delete(`/api/provider/${provider.id}`);
      // The list drops this row on success, so there is nothing to reset.
      onDeleted(provider.id);
    } catch (err) {
      // A 409 means claims still reference the provider; the message names the count.
      setError(getErrorMessage(err, 'Failed to remove provider'));
      setConfirmingDelete(false);
      setSubmitting(false);
    }
  }

  return (
    <>
      <tr>
        {editing ? (
          <>
            <td>
              <input
                className="data-table__edit-input"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                aria-label="Provider name"
              />
            </td>
            <td>
              <input
                className="data-table__edit-input"
                type="text"
                inputMode="numeric"
                value={form.npi}
                onChange={(e) => updateField('npi', e.target.value)}
                aria-label="NPI"
              />
            </td>
            <td>
              <input
                className="data-table__edit-input"
                type="text"
                value={form.specialty}
                onChange={(e) => updateField('specialty', e.target.value)}
                aria-label="Specialty"
              />
            </td>
          </>
        ) : (
          <>
            <td>{providerName(provider)}</td>
            <td className="data-table__mono">{provider.npi || '—'}</td>
            <td>{provider.specialty || '—'}</td>
          </>
        )}

        {canEdit && (
          <td className="data-table__actions">
            <div className="row-actions">
              {!editing && (
                <button type="button" className="button-secondary" onClick={startEditing}>
                  Edit
                </button>
              )}

              {editing && !confirmingDelete && (
                <>
                  <button type="button" onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={cancelEditing}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </>
              )}

              {editing && confirmingDelete && (
                <>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={handleDelete}
                    disabled={submitting}
                  >
                    {submitting ? 'Removing...' : 'Yes, remove'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={submitting}
                  >
                    Keep
                  </button>
                </>
              )}
            </div>
          </td>
        )}
      </tr>

      {(error || message || confirmingDelete) && (
        <tr className="data-table__row-message">
          <td colSpan={columnCount}>
            {confirmingDelete && (
              <span className="section-card__confirm">
                Remove this provider from the practice?
              </span>
            )}
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}
          </td>
        </tr>
      )}
    </>
  );
}
