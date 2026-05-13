import { useState } from 'react';
import { Link } from 'react-router-dom';
import { send_password_reset_email } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordPage() {
  const [email, set_email] = useState('');
  const [sent, set_sent] = useState(false);
  const [submitting, set_submitting] = useState(false);

  async function on_submit(e) {
    e.preventDefault();
    set_submitting(true);
    try {
      await send_password_reset_email(email);
    } catch {
      // ignore — same UX
    } finally {
      set_submitting(false);
      set_sent(true);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for {email}, a password-reset email is on its way.
        </p>
        <Link to="/auth/login" className="text-sm text-primary hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email you a reset link.</p>
      </div>
      <form onSubmit={on_submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => set_email(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting || !email}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <Link to="/auth/login" className="text-sm text-primary hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
