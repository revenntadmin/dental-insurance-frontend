import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import EditableSection from '../../components/EditableSection';
import { getErrorMessage } from '../../lib/apiError';
import {
  PAYER_CAPABILITIES,
  changedPayerFields,
  formatClearinghouse,
  toPayerForm,
} from '../../lib/payers';

export default function PayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payer, setPayer] = useState(null);
  const [form, setForm] = useState(null);
  const [clearinghouses, setClearinghouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function applyPayer(data) {
    setPayer(data);
    setForm(toPayerForm(data));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      apiClient.get(`/api/admin/payer/${id}`),
      apiClient.get('/api/admin/clearinghouse'),
    ])
      .then(([payerResponse, clearinghouseResponse]) => {
        if (cancelled) return;
        applyPayer(payerResponse.data);
        setClearinghouses(clearinghouseResponse.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load payer'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function savePayer() {
    const patch = changedPayerFields(form, payer);
    if (Object.keys(patch).length === 0) {
      return 'No changes to save.';
    }

    const { data } = await apiClient.patch(`/api/admin/payer/${id}`, patch);
    applyPayer(data);
    return 'Payer updated.';
  }

  async function deletePayer() {
    await apiClient.delete(`/api/admin/payer/${id}`);
    navigate('/admin/payer', { replace: true });
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!payer) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Payer</h1>
        </div>
        <p className="form-error">{error || 'Payer not found.'}</p>
        <Link to="/admin/payer">Back to payers</Link>
      </div>
    );
  }

  // Retiring a clearinghouse should not strand the payers filed under it, so the
  // one this payer already uses stays selectable even once it is inactive.
  const clearinghouseOptions = clearinghouses.filter(
    (clearinghouse) => clearinghouse.active || clearinghouse.id === payer.clearinghouse_id,
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>{payer.name}</h1>
        <Link to="/admin/payer">Back to payers</Link>
      </div>

      <EditableSection
        title="Payer details"
        description={`${formatClearinghouse(payer.clearinghouse)} · ${payer.payer_id}`}
        deleteLabel="Delete payer"
        deleteConfirmMessage="Delete this payer? Deactivate it instead if any plans or ERAs reference it."
        onSave={savePayer}
        onCancel={() => setForm(toPayerForm(payer))}
        onDelete={deletePayer}
      >
        {({ editing }) => (
          <>
            <div className="form-field">
              <label htmlFor="clearinghouse">Clearinghouse</label>
              <select
                id="clearinghouse"
                value={form.clearinghouse_id}
                onChange={(e) => updateField('clearinghouse_id', e.target.value)}
                disabled={!editing}
              >
                {clearinghouseOptions.map((clearinghouse) => (
                  <option key={clearinghouse.id} value={clearinghouse.id}>
                    {formatClearinghouse(clearinghouse.name)}
                    {clearinghouse.active ? '' : ' (inactive)'}
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
                disabled={!editing}
              />
              <p className="form-hint">
                Correcting this follows through to every plan, ERA and fee schedule using it.
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="payerName">Name</label>
              <input
                id="payerName"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="aliases">Aliases</label>
              <input
                id="aliases"
                type="text"
                value={form.aliases}
                onChange={(e) => updateField('aliases', e.target.value)}
                disabled={!editing}
              />
              <p className="form-hint">Comma separated. Practices can search payers by these.</p>
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="portalUrl">Portal URL</label>
              <input
                id="portalUrl"
                type="url"
                value={form.portal_url}
                onChange={(e) => updateField('portal_url', e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="claimsAddress">Claims address</label>
              <textarea
                id="claimsAddress"
                rows={2}
                value={form.claims_address}
                onChange={(e) => updateField('claims_address', e.target.value)}
                disabled={!editing}
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
                    disabled={!editing}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.enrollment_required}
                  onChange={(e) => updateField('enrollment_required', e.target.checked)}
                  disabled={!editing}
                />
                <span>Enrollment required</span>
              </label>
            </fieldset>

            <fieldset className="form-field form-field--full checkbox-group">
              <legend>Availability</legend>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateField('active', e.target.checked)}
                  disabled={!editing}
                />
                <span>Active</span>
              </label>
              <p className="form-hint">
                Inactive payers stay attached to existing records but disappear from the
                pickers practices use for new work.
              </p>
            </fieldset>
          </>
        )}
      </EditableSection>
    </div>
  );
}
