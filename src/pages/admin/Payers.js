import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { getErrorMessage } from '../../lib/apiError';
import {
  EMPTY_PAYER,
  PAYER_CAPABILITIES,
  capabilityLabels,
  formatClearinghouse,
  toPayerCreateBody,
} from '../../lib/payers';

const ACTIVE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function PayersPage() {
  const navigate = useNavigate();

  const [payers, setPayers] = useState([]);
  const [clearinghouses, setClearinghouses] = useState([]);
  const [clearinghouseFilter, setClearinghouseFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PAYER);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // A payer can only be filed under a clearinghouse still in service.
  const activeClearinghouses = useMemo(
    () => clearinghouses.filter((clearinghouse) => clearinghouse.active),
    [clearinghouses],
  );

  // The filter lists retired clearinghouses too — payers filed under one before it
  // was retired still need to be findable.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/api/admin/clearinghouse')
      .then(({ data }) => {
        if (!cancelled) setClearinghouses(data);
      })
      .catch(() => {
        // Non-fatal: the payer list still loads, only the pickers come up empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce typing so we hit the endpoint once the user pauses.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = {};
    if (clearinghouseFilter) params.clearinghouse_id = clearinghouseFilter;
    if (activeFilter) params.active = activeFilter;
    if (query) params.q = query;

    apiClient
      .get('/api/admin/payer', { params })
      .then(({ data }) => {
        if (!cancelled) setPayers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load payers'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearinghouseFilter, activeFilter, query]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleForm() {
    setFormError('');
    // Pre-fill the clearinghouse from whatever is on screen: the filter if one is set,
    // otherwise the only active clearinghouse when there is just one.
    const preset =
      clearinghouseFilter ||
      (activeClearinghouses.length === 1 ? activeClearinghouses[0].id : '');
    setForm({ ...EMPTY_PAYER, clearinghouse_id: preset });
    setShowForm((open) => !open);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/api/admin/payer', toPayerCreateBody(form));
      navigate(`/admin/payer/${data.id}`);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create payer'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Payers</h1>
        <button type="button" onClick={toggleForm}>
          {showForm ? 'Cancel' : 'New payer'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form form-grid" onSubmit={handleCreate}>
          <div className="form-field">
            <label htmlFor="clearinghouse">Clearinghouse</label>
            <select
              id="clearinghouse"
              value={form.clearinghouse_id}
              onChange={(e) => updateField('clearinghouse_id', e.target.value)}
              required
            >
              <option value="">Select a clearinghouse</option>
              {activeClearinghouses.map((clearinghouse) => (
                <option key={clearinghouse.id} value={clearinghouse.id}>
                  {formatClearinghouse(clearinghouse.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="payerId">Payer ID</label>
            <input
              id="payerId"
              type="text"
              value={form.payer_id}
              onChange={(e) => updateField('payer_id', e.target.value)}
              required
            />
            <p className="form-hint">The id this clearinghouse issues for the payer.</p>
          </div>

          <div className="form-field">
            <label htmlFor="payerName">Name</label>
            <input
              id="payerName"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="aliases">Aliases</label>
            <input
              id="aliases"
              type="text"
              value={form.aliases}
              onChange={(e) => updateField('aliases', e.target.value)}
            />
            <p className="form-hint">
              Comma separated. Practices search payers by these as often as by name.
            </p>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="portalUrl">Portal URL</label>
            <input
              id="portalUrl"
              type="url"
              value={form.portal_url}
              onChange={(e) => updateField('portal_url', e.target.value)}
            />
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="claimsAddress">Claims address</label>
            <textarea
              id="claimsAddress"
              rows={2}
              value={form.claims_address}
              onChange={(e) => updateField('claims_address', e.target.value)}
            />
          </div>

          <fieldset className="form-field form-field--full checkbox-group">
            <legend>Supported transactions</legend>
            {PAYER_CAPABILITIES.map(({ field, label }) => (
              <label key={field} className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form[field]}
                  onChange={(e) => updateField(field, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.enrollment_required}
                onChange={(e) => updateField('enrollment_required', e.target.checked)}
              />
              <span>Enrollment required</span>
            </label>
          </fieldset>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create payer'}
          </button>
        </form>
      )}

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search payers by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search payers by name or ID"
        />

        <label className="toolbar__filter" htmlFor="clearinghouseFilter">
          <span>Clearinghouse</span>
          <select
            id="clearinghouseFilter"
            value={clearinghouseFilter}
            onChange={(e) => setClearinghouseFilter(e.target.value)}
          >
            <option value="">All</option>
            {clearinghouses.map((clearinghouse) => (
              <option key={clearinghouse.id} value={clearinghouse.id}>
                {formatClearinghouse(clearinghouse.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar__filter" htmlFor="payerActiveFilter">
          <span>Status</span>
          <select
            id="payerActiveFilter"
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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Payer ID</th>
              <th>Clearinghouse</th>
              <th>Supports</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payers.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {query ? 'No payers match that search.' : 'No payers yet.'}
                </td>
              </tr>
            ) : (
              payers.map((payer) => {
                const supports = capabilityLabels(payer);

                return (
                  <tr
                    key={payer.id}
                    className="data-table__row--clickable"
                    onClick={() => navigate(`/admin/payer/${payer.id}`)}
                  >
                    <td>{payer.name}</td>
                    <td className="data-table__mono">{payer.payer_id}</td>
                    <td>{formatClearinghouse(payer.clearinghouse)}</td>
                    <td>{supports.length ? supports.join(', ') : '—'}</td>
                    <td>
                      <span
                        className={`status-badge status-badge--${
                          payer.active ? 'active' : 'inactive'
                        }`}
                      >
                        {payer.active ? 'Active' : 'Inactive'}
                      </span>
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
