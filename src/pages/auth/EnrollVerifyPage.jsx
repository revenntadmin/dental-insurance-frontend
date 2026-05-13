import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complete_phone_enrollment } from '@/lib/auth';
import { api } from '@/lib/api_client';
import { useMfa } from '@/features/auth/MfaContext';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EnrollVerifyPage() {
  const navigate = useNavigate();
  const { flow, clear } = useMfa();
  const { refresh_profile } = useAuth();
  const [otp, set_otp] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState(null);

  useEffect(() => {
    if (!flow) navigate('/auth/enroll-phone', { replace: true });
  }, [flow, navigate]);

  async function on_submit(e) {
    e.preventDefault();
    if (!flow) return;
    set_submitting(true);
    set_error(null);
    try {
      await complete_phone_enrollment(flow.verification_id, otp);
      await api.post('/api/me/mfa/confirm-enrollment');
      await refresh_profile();
      const { data: me } = await api.get('/api/me');
      clear();
      if (me.role === 'clearclaim_admin') navigate('/admin/dashboard');
      else navigate(`/p/${me.practice_id}/dashboard`);
    } catch {
      set_error('Verification failed. Try again.');
    } finally {
      set_submitting(false);
    }
  }

  if (!flow) return null;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Confirm your phone</h1>
        <p className="text-sm text-muted-foreground">Enter the 6-digit code we sent.</p>
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
          {submitting ? 'Verifying…' : 'Confirm'}
        </Button>
      </form>
    </div>
  );
}
