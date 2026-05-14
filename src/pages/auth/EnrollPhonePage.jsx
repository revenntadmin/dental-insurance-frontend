import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, start_phone_enrollment } from '@/lib/auth';
import { api } from '@/lib/api_client';
import { useMfa } from '@/features/auth/MfaContext';
import { useAuth } from '@/features/auth/useAuth';
import { useEnrollGuard } from '@/features/auth/useEnrollGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EnrollPhonePage() {
  const navigate = useNavigate();
  const { set_flow } = useMfa();
  const { refresh_profile } = useAuth();
  const { is_loading } = useEnrollGuard();
  const [phone, set_phone] = useState('+1');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState(null);

  const factors = auth.currentUser?.multiFactor?.enrolledFactors ?? [];
  const already_enrolled = factors.length > 0;
  const enrolled_phone_last_4 = already_enrolled ? factors[0].phoneNumber.slice(-4) : null;

  // Phone is already enrolled in Firebase — sync the DB and redirect
  useEffect(() => {
    if (!already_enrolled) return;
    const enrolled_phone = factors[0].phoneNumber;
    api
      .post('/api/me/mfa/confirm-enrollment', {
        phone: enrolled_phone,
        phone_last_4: enrolled_phone.slice(-4),
      })
      .catch(() => {})
      .finally(async () => {
        await refresh_profile();
        const { data: me } = await api.get('/api/me');
        if (me.role === 'clearclaim_admin') navigate('/admin/dashboard', { replace: true });
        else navigate(`/p/${me.practice_id}/dashboard`, { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function on_submit(e) {
    e.preventDefault();
    set_submitting(true);
    set_error(null);
    try {
      const verification_id = await start_phone_enrollment(phone, 'recaptcha-container');
      set_flow({
        mode: 'enrollment',
        verification_id,
        phone,
        phone_last_four: phone.slice(-4),
      });
      navigate('/auth/enroll-verify');
    } catch {
      set_error('Could not send a code. Check the phone number and try again.');
    } finally {
      set_submitting(false);
    }
  }

  if (is_loading) return null;

  if (already_enrolled) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Phone already registered</h1>
          <p className="text-sm text-muted-foreground">
            Your phone ending in {enrolled_phone_last_4} is registered for two-factor
            authentication. Syncing your account…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Add a phone number</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a verification code by SMS for two-factor authentication.
        </p>
      </div>
      <form onSubmit={on_submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile phone (E.164)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+15555550123"
            value={phone}
            onChange={(e) => set_phone(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send code'}
        </Button>
      </form>
      <div id="recaptcha-container" />
    </div>
  );
}
