import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import zxcvbn from 'zxcvbn';
import { api } from '@/lib/api_client';
import { useGuestGuard } from '@/features/auth/useGuestGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    password: z
      .string()
      .min(12, 'At least 12 characters')
      .regex(/[A-Z]/, 'One uppercase letter')
      .regex(/[a-z]/, 'One lowercase letter')
      .regex(/\d/, 'One digit'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ['confirm'] });

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-600'];

export function SetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const token = search.get('token');
  const { is_loading: auth_loading } = useGuestGuard();
  const [link_state, set_link_state] = useState('checking'); // checking | valid | invalid | expired | used
  const [first_name, set_first_name] = useState('');
  const [submitting, set_submitting] = useState(false);
  const [server_error, set_server_error] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const password = watch('password') || '';
  const strength = password ? zxcvbn(password).score : 0;

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (!token) { set_link_state('invalid'); return; }
      try {
        const { data } = await api.get(`/api/invite/${token}`);
        if (!cancelled) {
          set_first_name(data.first_name || '');
          set_link_state('valid');
        }
      } catch (err) {
        if (!cancelled) {
          const code = err?.response?.data?.error;
          if (code === 'invite_used') set_link_state('used');
          else if (code === 'invite_expired') set_link_state('expired');
          else set_link_state('invalid');
        }
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [token]);

  async function on_submit(values) {
    set_submitting(true);
    set_server_error(null);
    try {
      await api.post(`/api/invite/${token}/set-password`, { password: values.password });
      navigate('/auth/login?welcome=true');
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'invite_used' || code === 'invite_expired') {
        set_link_state(code === 'invite_used' ? 'used' : 'expired');
      } else {
        set_server_error('Could not set password. Please try again or contact support.');
      }
    } finally {
      set_submitting(false);
    }
  }

  if (auth_loading || link_state === 'checking') {
    return <p className="text-sm text-muted-foreground">Verifying link…</p>;
  }

  if (link_state === 'used') {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Link already used</h1>
        <p className="text-sm text-muted-foreground">
          This invitation has already been used to set a password.{' '}
          <a className="text-primary underline" href="/auth/login">Sign in</a> or contact your admin to resend the invite.
        </p>
      </div>
    );
  }

  if (link_state === 'expired' || link_state === 'invalid') {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">This link has expired</h1>
        <p className="text-sm text-muted-foreground">
          Ask your admin to resend the invite. Contact{' '}
          <a className="text-primary underline" href="mailto:support@clearclaim.io">
            support@clearclaim.io
          </a>{' '}
          if you need help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {first_name ? `Welcome, ${first_name}!` : 'Set your password'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use at least 12 characters, including uppercase, lowercase, and a digit.
        </p>
      </div>
      <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {password && (
            <div className="space-y-1">
              <div className="h-1 w-full rounded bg-muted">
                <div
                  className={`h-1 rounded ${STRENGTH_COLORS[strength]}`}
                  style={{ width: `${(strength + 1) * 20}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{STRENGTH_LABELS[strength]}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        {server_error && <p className="text-sm text-destructive">{server_error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set password'}
        </Button>
      </form>
    </div>
  );
}
