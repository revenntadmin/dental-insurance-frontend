import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { start_phone_enrollment } from '@/lib/auth';
import { useMfa } from '@/features/auth/MfaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EnrollPhonePage() {
  const navigate = useNavigate();
  const { set_flow } = useMfa();
  const [phone, set_phone] = useState('+1');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState(null);

  async function on_submit(e) {
    e.preventDefault();
    set_submitting(true);
    set_error(null);
    try {
      const verification_id = await start_phone_enrollment(phone, 'recaptcha-container');
      set_flow({
        mode: 'enrollment',
        verification_id,
        phone_last_four: phone.slice(-4),
      });
      navigate('/auth/enroll-verify');
    } catch {
      set_error('Could not send a code. Check the phone number and try again.');
    } finally {
      set_submitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Add a phone number</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a verification code by SMS. Phone numbers are stored only in Firebase, never in our database.
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
    </div>
  );
}
