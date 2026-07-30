import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState('working');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setError('This link is missing required parameters.');
      return;
    }

    if (mode === 'verifyEmail') {
      applyActionCode(auth, oobCode)
        .then(() => setStatus('verified'))
        .catch((err) => {
          setStatus('error');
          setError(err.message || 'This link is invalid or has expired.');
        });
      return;
    }

    if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, oobCode)
        .then((resolvedEmail) => {
          setEmail(resolvedEmail);
          setStatus('reset_form');
        })
        .catch((err) => {
          setStatus('error');
          setError(err.message || 'This link is invalid or has expired.');
        });
      return;
    }

    setStatus('error');
    setError('Unsupported action.');
  }, [mode, oobCode]);

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('reset_complete');
    } catch (err) {
      setError(err.message || 'Could not set your password.');
    }
  }

  if (status === 'working') {
    return <div className="auth-page">Working...</div>;
  }

  if (status === 'error') {
    return (
      <div className="auth-page">
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (status === 'verified' || status === 'reset_complete') {
    return (
      <div className="auth-page">
        <p>All set. You can now sign in.</p>
        <button onClick={() => navigate('/login')}>Go to sign in</button>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSetPassword}>
        <h1>Set your password</h1>
        <p>{email}</p>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Set password</button>
      </form>
    </div>
  );
}
