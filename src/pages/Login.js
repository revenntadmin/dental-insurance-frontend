import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mfaResolver, setMfaResolver] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);

        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        const phoneInfoOptions = {
          multiFactorHint: resolver.hints[0],
          session: resolver.session,
        };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const id = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
        setVerificationId(id);
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      await mfaResolver.resolveSignIn(multiFactorAssertion);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setSubmitting(false);
    }
  }

  if (mfaResolver && verificationId) {
    return (
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleVerifyCode}>
          <h1>Enter verification code</h1>
          <p>We texted a code to your enrolled phone number.</p>
          <label htmlFor="smsCode">Verification code</label>
          <input
            id="smsCode"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            Verify
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleLogin}>
        <h1>Sign in to ClearClaim</h1>
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
          Sign in
        </button>
        <div id="recaptcha-container" />
      </form>
    </div>
  );
}
