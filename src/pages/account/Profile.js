import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTenancyGuard } from '../../hooks/useTenancyGuard';
import { formatRole } from '../../lib/authNavigation';

export default function ProfilePage() {
  useTenancyGuard();
  const { profile, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
  }, [profile?.first_name, profile?.last_name]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await apiClient.patch('/api/auth/me', {
        first_name: firstName,
        last_name: lastName,
      });
      await refreshProfile();
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <p className="form-hint">Update your personal account details.</p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={profile?.email || ''} disabled />

        <label htmlFor="role">Role</label>
        <input id="role" type="text" value={formatRole(profile?.role)} disabled />

        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        {profile?.mfa_enrolled && (
          <>
            <label htmlFor="mfaPhone">Two-factor phone</label>
            <input
              id="mfaPhone"
              type="text"
              value={profile?.mfa_phone_last_4 ? `(***) ***-${profile.mfa_phone_last_4}` : 'Enrolled'}
              disabled
            />
          </>
        )}

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
