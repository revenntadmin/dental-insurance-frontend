import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, completePhoneEnrollment } from '../lib/auth';
import { useMfa } from '../context/MfaContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollGuard } from '../hooks/useEnrollGuard';
import { dashboardPath } from '../lib/authNavigation';
import apiClient from '../api/apiClient';

export default function MfaEnrollVerify() {
  const navigate = useNavigate();
  const { flow, clearFlow } = useMfa();
  const { refreshProfile } = useAuth();
  useEnrollGuard();
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!flow) navigate('/mfa-enroll', { replace: true });
  }, [flow, navigate]);

  async function handleEnroll(e) {
    e.preventDefault();
    if (!flow) return;
    setError('');
    setSubmitting(true);
    try {
      await completePhoneEnrollment(flow.verificationId, smsCode);
      const phone = auth.currentUser.multiFactor.enrolledFactors[0].phoneNumber;
      await apiClient.post('/api/auth/mfa/confirm-enrollment', {
        phone,
        phone_last_4: phone.slice(-4),
      });
      clearFlow();
      const profile = await refreshProfile();
      navigate(dashboardPath(profile) || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setSubmitting(false);
    }
  }

  if (!flow) {
    return null;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleEnroll}>
        <h1>Confirm your phone</h1>
        <p>Enter the 6-digit code we sent to (***) ***-{flow.phoneLastFour}.</p>
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
          {submitting ? 'Verifying...' : 'Verify and enroll'}
        </button>
      </form>
    </div>
  );
}
