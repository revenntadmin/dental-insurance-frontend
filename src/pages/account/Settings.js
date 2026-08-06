import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import ProvidersCard from '../../components/ProvidersCard';
import { useAuth } from '../../context/AuthContext';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { isPracticeAdmin } from '../../lib/authNavigation';

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

export default function SettingsPage() {
  useTenancyGuard();
  const { profile, refreshProfile } = useAuth();
  const canEdit = isPracticeAdmin(profile);

  const [name, setName] = useState('');
  const [npi, setNpi] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.practice_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiClient
      .get('/api/practice/me')
      .then(({ data }) => {
        setName(data.name || '');
        setNpi(data.npi || '');
        setTaxId(data.tax_id || '');
        setAddress(data.address || '');
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Failed to load practice settings'));
      })
      .finally(() => setLoading(false));
  }, [profile?.practice_id]);

  async function handleSave(e) {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await apiClient.patch('/api/practice/me', {
        name,
        npi,
        tax_id: taxId,
        address,
      });
      await refreshProfile();
      setMessage('Practice settings updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update practice settings'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Practice Settings</h1>
      </div>

      <section className="section-card section-card--full">
        <div className="section-card__header">
          <h2 className="section-card__title">Practice details</h2>
        </div>

        <p className="form-hint">
          {canEdit
            ? 'Manage your practice account details.'
            : 'View your practice details. Contact a practice admin to make changes.'}
        </p>

        <form onSubmit={handleSave}>
          <div className="form-grid form-grid--full">
            <div className="form-field">
              <label htmlFor="practiceName">Practice name</label>
              <input
                id="practiceName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="npi">Practice NPI</label>
              <input
                id="npi"
                type="text"
                value={npi}
                onChange={(e) => setNpi(e.target.value)}
                disabled={!canEdit}
              />
              <p className="form-hint">
                The organization (Type 2) NPI. Individual providers have their own below.
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="taxId">Tax ID</label>
              <input
                id="taxId"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          {error && <p className="form-error section-card__message">{error}</p>}
          {message && <p className="form-success section-card__message">{message}</p>}

          {canEdit && (
            <div className="section-card__actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          )}
        </form>
      </section>

      <ProvidersCard canEdit={canEdit} />
    </div>
  );
}
