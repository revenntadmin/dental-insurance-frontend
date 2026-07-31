import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
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
        <h1>Account Settings</h1>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <p className="form-hint">
          {canEdit
            ? 'Manage your practice account details.'
            : 'View your practice details. Contact a practice admin to make changes.'}
        </p>

        <label htmlFor="practiceName">Practice name</label>
        <input
          id="practiceName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          required
        />

        <label htmlFor="npi">NPI</label>
        <input
          id="npi"
          type="text"
          value={npi}
          onChange={(e) => setNpi(e.target.value)}
          disabled={!canEdit}
        />

        <label htmlFor="taxId">Tax ID</label>
        <input
          id="taxId"
          type="text"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          disabled={!canEdit}
        />

        <label htmlFor="address">Address</label>
        <textarea
          id="address"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!canEdit}
        />

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        {canEdit && (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save settings'}
          </button>
        )}
      </form>
    </div>
  );
}
