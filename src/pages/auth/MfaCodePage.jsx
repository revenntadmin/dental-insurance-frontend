import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMfa } from '@/features/auth/MfaContext';
import { useAuth } from '@/features/auth/useAuth';
import { complete_mfa } from '@/lib/auth';
import { api } from '@/lib/api_client';
import { format_phone_last_four } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function MfaCodePage() {
  const navigate = useNavigate();
  const { flow, clear } = useMfa();
  const { refresh_profile } = useAuth();
  const [otp, set_otp] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState(null);
  const [resend_in, set_resend_in] = useState(30);

  useEffect(() => {
    if (!flow) navigate('/auth/login', { replace: true });
  }, [flow, navigate]);

  useEffect(() => {
    if (resend_in <= 0) return undefined;
    const t = setTimeout(() => set_resend_in((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resend_in]);

  async function on_submit(e) {
    e.preventDefault();
    if (!flow) return;
    set_submitting(true);
    set_error(null);
    try {
      await complete_mfa(flow.verification_id, otp, flow.resolver);
      const { data: me } = await api.get('/api/me');
      await refresh_profile();
      clear();
      if (me.role === 'clearclaim_admin') navigate('/admin/dashboard');
      else navigate(`/p/${me.practice_id}/dashboard`);
    } catch {
      set_error('That code looks wrong. Try again.');
    } finally {
      set_submitting(false);
    }
  }

  if (!flow) return null;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Enter verification code</h1>
        <p className="text-sm text-muted-foreground">
          Enter the code sent to {format_phone_last_four(flow.phone_last_four)}
        </p>
      </div>
      <form onSubmit={on_submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="otp">6-digit code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => set_otp(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || otp.length !== 6}>
          {submitting ? 'Verifying…' : 'Verify'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={resend_in > 0}
          onClick={() => set_resend_in(30)}
        >
          {resend_in > 0 ? `Resend code in ${resend_in}s` : 'Resend code'}
        </Button>
      </form>
    </div>
  );
}
