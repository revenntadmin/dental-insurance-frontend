import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMfa } from '../context/MfaContext';
import { useAuth } from '../context/AuthContext';
import { useGuestGuard } from '../hooks/useGuestGuard';
import { completeMfa, auth } from '../lib/auth';
import { dashboardPath } from '../lib/authNavigation';
import apiClient from '../api/apiClient';

function formatPhoneLastFour(lastFour) {
  return lastFour ? `(***) ***-${lastFour}` : 'your phone';
}

export default function MfaVerify() {
  const navigate = useNavigate();
  const { flow, clearFlow } = useMfa();
  const { refreshProfile, profile } = useAuth();
  useGuestGuard();
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!flow) navigate('/login', { replace: true });
  }, [flow, navigate]);

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!flow) return;
    setError('');
    setSubmitting(true);
    try {
      await completeMfa(flow.verificationId, smsCode, flow.resolver);
      const factors = auth.currentUser?.multiFactor?.enrolledFactors ?? [];
      if (factors.length > 0) {
        const phone = factors[0].phoneNumber;
        await apiClient.post('/api/auth/mfa/confirm-enrollment', {
          phone,
          phone_last_4: phone.slice(-4),
        });
      }
      await apiClient.post('/api/auth/log-login');
      const updatedProfile = await refreshProfile();
      clearFlow();
      navigate(dashboardPath(updatedProfile || profile) || '/');
    } catch {
      setError('That code looks wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!flow) {
    return null;
  }

  const phoneLastFour = flow.phoneLastFour || profile?.mfa_phone_last_4;

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleVerifyCode}>
        <h1>Enter verification code</h1>
        <p>Enter the code sent to {formatPhoneLastFour(phoneLastFour)}.</p>
        <label htmlFor="smsCode">6-digit code</label>
        <input
          id="smsCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={smsCode}
          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting || smsCode.length !== 6}>
          {submitting ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
