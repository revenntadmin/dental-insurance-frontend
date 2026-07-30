import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { multiFactor } from 'firebase/auth';
import { auth, startPhoneEnrollment, reauthenticate } from '../lib/auth';
import { useMfa } from '../context/MfaContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollGuard } from '../hooks/useEnrollGuard';
import { dashboardPath } from '../lib/authNavigation';
import apiClient from '../api/apiClient';
import { phoneAuthTesting, testPhoneNumber } from '../lib/mfa';

export default function MfaEnroll() {
  const navigate = useNavigate();
  const { setFlow } = useMfa();
  const { refreshProfile } = useAuth();
  const { loading } = useEnrollGuard();
  const [phoneNumber, setPhoneNumber] = useState(
    phoneAuthTesting && testPhoneNumber ? testPhoneNumber : '+1',
  );
  const [password, setPassword] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const factors = auth.currentUser ? multiFactor(auth.currentUser).enrolledFactors : [];
  const alreadyEnrolled = factors.length > 0;
  const enrolledPhoneLastFour = alreadyEnrolled ? factors[0].phoneNumber.slice(-4) : null;

  useEffect(() => {
    if (!alreadyEnrolled || syncing) return;
    setSyncing(true);
    const enrolledPhone = factors[0].phoneNumber;
    apiClient
      .post('/api/auth/mfa/confirm-enrollment', {
        phone: enrolledPhone,
        phone_last_4: enrolledPhone.slice(-4),
      })
      .catch(() => { })
      .finally(async () => {
        const profile = await refreshProfile();
        navigate(dashboardPath(profile) || '/', { replace: true });
      });
  }, [alreadyEnrolled]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendCode() {
    const verificationId = await startPhoneEnrollment(phoneNumber, 'recaptcha-container');
    setFlow({
      mode: 'enrollment',
      verificationId,
      phone: phoneNumber,
      phoneLastFour: phoneNumber.slice(-4),
    });
    navigate('/mfa-enroll/verify');
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sendCode();
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
        setError('For security, please re-enter your password to continue.');
      } else {
        setError(err.message || 'Failed to send verification code');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReauth(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await reauthenticate(password);
      setPassword('');
      setNeedsReauth(false);
      await sendCode();
    } catch (err) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('Incorrect password.');
      } else {
        setError('Could not verify your password. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (alreadyEnrolled) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Phone already registered</h1>
          <p>
            Your phone ending in {enrolledPhoneLastFour} is registered for two-factor
            authentication. Syncing your account...
          </p>
        </div>
      </div>
    );
  }

  const form = needsReauth ? (
    <form className="auth-form" onSubmit={handleReauth}>
      <h1>Confirm your password</h1>
      <p>For security, please re-enter your password to set up two-factor authentication.</p>
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting || !password}>
        {submitting ? 'Verifying...' : 'Continue'}
      </button>
    </form>
  ) : (
    <form className="auth-form" onSubmit={handleSendCode}>
      <h1>Set up two-factor authentication</h1>
      <p>ClearClaim requires a phone number for SMS verification codes.</p>
      {phoneAuthTesting && (
        <p className="form-hint">
          Local testing mode is on. Use a fictional test number from Firebase Console
          (Authentication → Sign-in method → Phone numbers for testing).
          {testPhoneNumber ? ` Configured: ${testPhoneNumber}.` : ' Example: +16505553434.'}
        </p>
      )}
      <label htmlFor="phoneNumber">Mobile phone (E.164 format)</label>
      <input
        id="phoneNumber"
        type="tel"
        placeholder="+15555550123"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send code'}
      </button>
    </form>
  );

  return (
    <div className="auth-page">
      {form}
      <div id="recaptcha-container" />
    </div>
  );
}
