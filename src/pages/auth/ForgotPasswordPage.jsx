import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../../lib/auth.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useToast } from '../../hooks/use_toast.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      toast(err.message || 'Failed to send reset email', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-xl font-semibold mb-4">Reset password</h1>
        {sent ? (
          <p className="text-sm text-slate-600">
            If an account exists for <span className="font-medium">{email}</span>, a password
            reset link has been sent.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={busy || !email} className="w-full">
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
