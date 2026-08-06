import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import NewProviderForm from './NewProviderForm';
import ProviderRow from './ProviderRow';
import { getErrorMessage } from '../lib/apiError';
import { sortProviders } from '../lib/providers';

/**
 * The practice's rendering providers as a list, one row each, editable in place.
 * Only a practice admin gets the add / edit / remove actions; everyone else reads
 * the same list.
 *
 * The endpoint pages, but a practice has tens of providers rather than hundreds, so
 * this asks for the maximum page and skips a pager. If a practice ever outgrows it,
 * /api/provider/search is the seam to add.
 */
export default function ProvidersCard({ canEdit }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  // The actions column only exists for admins, so row messages span a different width.
  const columnCount = canEdit ? 4 : 3;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    apiClient
      .get('/api/provider', { params: { limit: 200 } })
      .then(({ data }) => {
        if (!cancelled) setProviders(sortProviders(data));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load providers'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSaved(updated) {
    setProviders((current) =>
      sortProviders(current.map((provider) => (provider.id === updated.id ? updated : provider))),
    );
  }

  function handleCreated(created) {
    // Close first: the provider is already saved, so a throw upstream must not
    // leave the form open looking like the create failed.
    setAdding(false);
    setProviders((current) => sortProviders([...current, created]));
  }

  function handleDeleted(id) {
    setProviders((current) => current.filter((provider) => provider.id !== id));
  }

  return (
    <section className="section-card section-card--full">
      <div className="section-card__header">
        <h2 className="section-card__title">Providers</h2>
        {canEdit && (
          <button type="button" className="section-card__edit" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : 'Add provider'}
          </button>
        )}
      </div>

      <p className="form-hint">
        {canEdit
          ? 'The individual providers who render care under this practice. Their NPIs go out on eligibility checks and claims.'
          : 'The individual providers who render care under this practice. Contact a practice admin to make changes.'}
      </p>

      {adding && (
        <NewProviderForm onCreated={handleCreated} onCancel={() => setAdding(false)} />
      )}

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>NPI</th>
              <th>Specialty</th>
              {canEdit && <th className="data-table__actions" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>No providers on file yet.</td>
              </tr>
            ) : (
              providers.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  canEdit={canEdit}
                  columnCount={columnCount}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
