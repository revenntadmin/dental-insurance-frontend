import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function MfaEnroll() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      const multiFactorSession = await multiFactor(auth.currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const id = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber, session: multiFactorSession },
        recaptchaVerifier
      );
      setVerificationId(id);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnroll(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'Primary phone');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={verificationId ? handleEnroll : handleSendCode}>
        <h1>Set up two-factor authentication</h1>
        <p>ClearClaim requires a phone number for SMS verification codes.</p>

        {!verificationId && (
          <>
            <label htmlFor="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              placeholder="+15551234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </>
        )}

        {verificationId && (
          <>
            <label htmlFor="smsCode">Verification code</label>
            <input
              id="smsCode"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              required
            />
          </>
        )}

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {verificationId ? 'Verify and enroll' : 'Send code'}
        </button>
        <div id="recaptcha-container" />
      </form>
    </div>
  );
}
