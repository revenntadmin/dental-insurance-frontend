import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginWithEmail, completeMfaSignIn, getRecaptcha } from '../../lib/auth.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../hooks/use_toast.jsx';

export default function LoginPage() {
  const { user, phoneEnrolled, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [step, setStep] = useState('credentials'); // credentials | mfa
  const [mfaState, setMfaState] = useState(null); // { resolver, verificationId }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Prime invisible reCAPTCHA so it can render on submit.
    try { getRecaptcha(); } catch (_e) { /* noop */ }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (!phoneEnrolled) navigate('/enroll-phone', { replace: true });
      else navigate(location.state?.from?.pathname || '/', { replace: true });
    }
  }, [user, phoneEnrolled, loading, navigate, location]);

  async function onCredentialsSubmit(values) {
    setBusy(true);
    try {
      const res = await loginWithEmail(values.email, values.password);
      if (res.status === 'mfa_required') {
        setMfaState({ resolver: res.resolver, verificationId: res.verificationId });
        setStep('mfa');
      }
      // success: AuthContext picks up the user; useEffect navigates.
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onMfaSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await completeMfaSignIn(mfaState.resolver, mfaState.verificationId, code.trim());
      // AuthContext will update; useEffect will navigate.
    } catch (err) {
      toast(err.message || 'Invalid code', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-brand-600">ClearClaim</div>
          <div className="text-sm text-slate-500 mt-1">Sign in to your practice</div>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message}
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="text-center text-sm">
              <Link to="/forgot-password" className="text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {step === 'mfa' && (
          <form onSubmit={onMfaSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">
              We sent a verification code to your phone. Enter it below to continue.
            </p>
            <Input
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" disabled={busy || code.length < 6} className="w-full">
              {busy ? 'Verifying…' : 'Verify and sign in'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
