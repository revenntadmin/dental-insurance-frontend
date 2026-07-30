import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { login } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useMfa } from '../context/MfaContext';
import { useGuestGuard } from '../hooks/useGuestGuard';
import { dashboardPath } from '../lib/authNavigation';
import { skipMfa } from '../lib/mfa';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const { setFlow } = useMfa();
  const { loading } = useGuestGuard();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message] = useState(location.state?.message || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.get('/api/auth/user-exists', { params: { email } });
      if (!data.exists) {
        setError('No ClearClaim account exists for that email.');
        return;
      }

      const result = await login(email, password, skipMfa ? null : 'recaptcha-container');
      if (result.status === 'success' || (skipMfa && result.status === 'enroll_required')) {
        await apiClient.post('/api/auth/log-login');
        const profile = await refreshProfile();
        navigate(dashboardPath(profile) || '/');
      } else if (result.status === 'enroll_required') {
        navigate('/mfa-enroll');
      } else if (result.status === 'mfa_required') {
        if (skipMfa) {
          setError('This account has MFA enabled. Set VITE_SKIP_MFA=false to sign in with SMS.');
          return;
        }
        setFlow({
          mode: 'login',
          verificationId: result.verificationId,
          resolver: result.resolver,
          phoneLastFour: result.phoneLastFour,
        });
        navigate('/mfa-verify');
      }
    } catch (err) {
      const code = err?.code || '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : err.message || 'Failed to sign in',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleLogin}>
        <h1>Sign in to ClearClaim</h1>
        {message && <p>{message}</p>}
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        {!skipMfa && <div id="recaptcha-container" />}
      </form>
    </div>
  );
}
