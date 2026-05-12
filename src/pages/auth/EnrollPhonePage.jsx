import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import {
  enrollPhoneStart,
  enrollPhoneComplete,
  reauthenticate,
  sendEmailVerificationLink,
} from '../../lib/auth.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../hooks/use_toast.jsx';

export default function EnrollPhonePage() {
  const { user, phoneEnrolled } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Email verification step
  const [emailSent, setEmailSent] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Re-auth step (shown when Firebase demands a recent login)
  const [needsReauth, setNeedsReauth] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  // Phone enrollment step
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
    else if (phoneEnrolled) navigate('/', { replace: true });
  }, [user, phoneEnrolled, navigate]);

  // ── Email verification ───────────────────────────────────────────────────

  async function sendVerificationEmail() {
    setBusy(true);
    try {
      await sendEmailVerificationLink(user);
      setEmailSent(true);
      toast('Verification email sent — check your inbox.', 'success');
    } catch (err) {
      toast(err.message || 'Failed to send verification email', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function checkEmailVerified() {
    setCheckingEmail(true);
    try {
      await user.reload();
      const { auth } = await import('../../lib/firebase.js');
      if (auth.currentUser?.emailVerified) {
        toast('Email verified! Now enroll your phone.', 'success');
        navigate('/enroll-phone', { replace: true });
      } else {
        toast('Email not verified yet — click the link in the email first.', 'error');
      }
    } finally {
      setCheckingEmail(false);
    }
  }

  // ── Phone enrollment ─────────────────────────────────────────────────────

  async function sendCode(e) {
    e.preventDefault();
    await attemptSendCode(toE164(phone));
  }

  async function attemptSendCode(phoneNumber) {
    setBusy(true);
    try {
      const id = await enrollPhoneStart(user, phoneNumber);
      setVerificationId(id);
      toast('Verification code sent.', 'success');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        // Save the phone number so we can retry after re-auth.
        setPendingPhone(phoneNumber);
        setNeedsReauth(true);
      } else {
        toast(err.message || 'Failed to send code', 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitReauth(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await reauthenticate(user, password);
      setPassword('');
      setNeedsReauth(false);
      toast('Re-authenticated. Sending code now…', 'success');
      // Retry the enrollment automatically.
      await attemptSendCode(pendingPhone);
    } catch (err) {
      toast(err.message || 'Re-authentication failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await enrollPhoneComplete(user, verificationId, code.trim());
      toast('Phone enrolled.', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      toast(err.message || 'Verification failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const emailVerified = user.emailVerified;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="card w-full max-w-md p-8">
        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-6 text-xs">
          <Step n={1} done={emailVerified} active={!emailVerified} label="Verify email" />
          <div className="flex-1 h-px bg-slate-200" />
          <Step n={2} done={phoneEnrolled} active={emailVerified && !phoneEnrolled} label="Enroll phone" />
        </div>

        {/* Step 1 — email not yet verified */}
        {!emailVerified && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold">Verify your email first</h1>
              <p className="text-sm text-slate-500 mt-1">
                Firebase requires a verified email before you can add SMS two-factor authentication.
              </p>
            </div>

            {!emailSent ? (
              <Button onClick={sendVerificationEmail} disabled={busy} className="w-full">
                {busy ? 'Sending…' : 'Send verification email'}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 text-center">
                  We sent a link to <strong>{user.email}</strong>.
                  Click it, then come back here and press the button below.
                </p>
                <Button onClick={checkEmailVerified} disabled={checkingEmail} className="w-full">
                  {checkingEmail ? 'Checking…' : "I've verified my email"}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-slate-500 hover:underline"
                  onClick={sendVerificationEmail}
                  disabled={busy}
                >
                  Resend email
                </button>
              </div>
            )}
          </>
        )}

        {/* Re-auth prompt — session too old */}
        {emailVerified && needsReauth && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold">Confirm your password</h1>
              <p className="text-sm text-slate-500 mt-1">
                For security, Firebase requires a recent sign-in before enrolling two-factor authentication.
                Enter your password to continue.
              </p>
            </div>
            <form onSubmit={submitReauth} className="space-y-4">
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" disabled={busy || !password} className="w-full">
                {busy ? 'Confirming…' : 'Confirm and continue'}
              </Button>
            </form>
          </>
        )}

        {/* Step 2 — email verified, enroll phone */}
        {emailVerified && !needsReauth && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold">Set up two-factor authentication</h1>
              <p className="text-sm text-slate-500 mt-1">
                For your security, ClearClaim requires SMS verification.
              </p>
            </div>

            {!verificationId ? (
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <Input
                    label="Phone number"
                    placeholder="(555) 555-5555 or +1 555 555 5555"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    US numbers are auto-formatted. For other countries include the country code, e.g. +44…
                  </p>
                </div>
                <Button type="submit" disabled={busy || !phone} className="w-full">
                  {busy ? 'Sending…' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={verify} className="space-y-4">
                <Input
                  label="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <Button type="submit" disabled={busy || code.length < 6} className="w-full">
                  {busy ? 'Verifying…' : 'Verify and continue'}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-slate-500 hover:underline"
                  onClick={() => { setVerificationId(null); setCode(''); }}
                >
                  Use a different number
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Normalize to E.164 format required by Firebase.
// If the number already starts with + we leave it alone.
// Otherwise strip all non-digits and prepend +1 (US/Canada).
function toE164(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) {
    // Keep as-is but strip spaces/dashes between digits.
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '');
  // If they included the leading 1 (e.g. 15551234567) don't double-add it.
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  return '+1' + digits;
}

function Step({ n, done, active, label }) {
  const circleCls = done
    ? 'bg-emerald-500 text-white'
    : active
    ? 'bg-brand-600 text-white'
    : 'bg-slate-200 text-slate-500';
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-medium ${circleCls}`}>
        {done ? '✓' : n}
      </span>
      <span className={active ? 'font-medium text-slate-900' : 'text-slate-500'}>{label}</span>
    </div>
  );
}
