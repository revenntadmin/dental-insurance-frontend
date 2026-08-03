import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { getErrorMessage } from '../../lib/apiError';
import { formatClearinghouse } from '../../lib/payers';

const ACTIVE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

/**
 * A clearinghouse has two fields and a handful of rows, so it is edited in place in
 * the table rather than on a page of its own. Retiring one hides every payer under
 * it from practice-facing lookups at once, which is why the API refuses to delete a
 * clearinghouse any payer still references.
 */
export default function ClearinghousesPage() {
  const [clearinghouses, setClearinghouses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', active: true });
  const [rowError, setRowError] = useState('');
  const [rowBusy, setRowBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get('/api/admin/clearinghouse', {
        params: activeFilter ? { active: activeFilter } : undefined,
      })
      .then(({ data }) => {
        if (!cancelled) setClearinghouses(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load clearinghouses'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  function toggleForm() {
    setFormError('');
    setNewName('');
    setShowForm((open) => !open);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/admin/clearinghouse', { name: newName });
      // The filter may exclude what was just created, so re-sort locally only when it fits.
      if (!activeFilter || (activeFilter === 'true') === data.active) {
        setClearinghouses((current) =>
          [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setNewName('');
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create clearinghouse'));
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(clearinghouse) {
    setRowError('');
    setConfirmingDelete(false);
    setEditingId(clearinghouse.id);
    setEditForm({ name: clearinghouse.name, active: clearinghouse.active });
  }

  function cancelEditing() {
    setRowError('');
    setConfirmingDelete(false);
    setEditingId(null);
  }

  async function handleSave(clearinghouse) {
    const patch = {};
    if (editForm.name.trim().toLowerCase() !== clearinghouse.name) {
      patch.name = editForm.name.trim();
    }
    if (editForm.active !== clearinghouse.active) {
      patch.active = editForm.active;
    }
    if (Object.keys(patch).length === 0) {
      cancelEditing();
      return;
    }

    setRowError('');
    setRowBusy(true);
    try {
      const { data } = await apiClient.patch(
        `/api/admin/clearinghouse/${clearinghouse.id}`,
        patch,
      );
      setClearinghouses((current) =>
        current.map((row) => (row.id === data.id ? data : row)),
      );
      setEditingId(null);
    } catch (err) {
      setRowError(getErrorMessage(err, 'Failed to save changes'));
    } finally {
      setRowBusy(false);
    }
  }

  async function handleDelete(clearinghouse) {
    setRowError('');
    setRowBusy(true);
    try {
      await apiClient.delete(`/api/admin/clearinghouse/${clearinghouse.id}`);
      setClearinghouses((current) => current.filter((row) => row.id !== clearinghouse.id));
      setEditingId(null);
      setConfirmingDelete(false);
    } catch (err) {
      setRowError(getErrorMessage(err, 'Failed to delete clearinghouse'));
      setConfirmingDelete(false);
    } finally {
      setRowBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clearinghouses</h1>
        <button type="button" onClick={toggleForm}>
          {showForm ? 'Cancel' : 'New clearinghouse'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form form-grid" onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="clearinghouseName">Name</label>
            <input
              id="clearinghouseName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <p className="form-hint">Stored lowercase, so &ldquo;Stedi&rdquo; and &ldquo;stedi&rdquo; stay one clearinghouse.</p>
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create clearinghouse'}
          </button>
        </form>
      )}

      <div className="toolbar">
        <label className="toolbar__filter" htmlFor="activeFilter">
          <span>Status</span>
          <select
            id="activeFilter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            {ACTIVE_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {rowError && <p className="form-error">{rowError}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th className="data-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clearinghouses.length === 0 ? (
              <tr>
                <td colSpan={3}>No clearinghouses match this filter.</td>
              </tr>
            ) : (
              clearinghouses.map((clearinghouse) => {
                const editing = editingId === clearinghouse.id;

                return (
                  <tr key={clearinghouse.id}>
                    <td>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((current) => ({ ...current, name: e.target.value }))
                          }
                          aria-label="Clearinghouse name"
                        />
                      ) : (
                        formatClearinghouse(clearinghouse.name)
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={editForm.active}
                            onChange={(e) =>
                              setEditForm((current) => ({ ...current, active: e.target.checked }))
                            }
                          />
                          <span>Active</span>
                        </label>
                      ) : (
                        <span
                          className={`status-badge status-badge--${
                            clearinghouse.active ? 'active' : 'inactive'
                          }`}
                        >
                          {clearinghouse.active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="data-table__actions">
                      {editing ? (
                        <div className="row-actions">
                          {confirmingDelete ? (
                            <>
                              <span className="section-card__confirm">
                                Delete this clearinghouse?
                              </span>
                              <button
                                type="button"
                                className="button-danger"
                                onClick={() => handleDelete(clearinghouse)}
                                disabled={rowBusy}
                              >
                                {rowBusy ? 'Deleting...' : 'Yes, delete'}
                              </button>
                              <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={rowBusy}
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSave(clearinghouse)}
                                disabled={rowBusy || !editForm.name.trim()}
                              >
                                {rowBusy ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="button-secondary"
                                onClick={cancelEditing}
                                disabled={rowBusy}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="button-danger"
                                onClick={() => setConfirmingDelete(true)}
                                disabled={rowBusy}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => startEditing(clearinghouse)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
