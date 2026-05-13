import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/auth';
import { api } from '@/lib/api_client';
import { useAuth } from '@/features/auth/useAuth';
import { useMfa } from '@/features/auth/MfaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { refresh_profile } = useAuth();
  const { set_flow } = useMfa();
  const [server_error, set_server_error] = useState(null);
  const [submitting, set_submitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  async function on_submit(values) {
    set_submitting(true);
    set_server_error(null);
    try {
      const result = await login(values.email, values.password, 'recaptcha-container');
      if (result.status === 'success') {
        const { data: me } = await api.get('/api/me');
        await refresh_profile();
        if (me.role === 'clearclaim_admin') navigate('/admin/dashboard');
        else navigate(`/p/${me.practice_id}/dashboard`);
      } else if (result.status === 'enroll_required') {
        navigate('/auth/enroll-phone');
      } else if (result.status === 'mfa_required') {
        set_flow({
          mode: 'login',
          verification_id: result.verification_id,
          resolver: result.resolver,
          phone_last_four: result.phone_last_four,
        });
        navigate('/auth/mfa-code');
      }
    } catch (err) {
      const code = err?.code || '';
      set_server_error(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'Invalid email or password.'
          : 'Sign-in failed. Please try again.',
      );
    } finally {
      set_submitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your work email to continue.</p>
      </div>

      {search.get('welcome') === 'true' && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Your account is ready — sign in to continue.
        </div>
      )}
      {search.get('reason') === 'mfa_required' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Please sign in again to verify your phone.
        </div>
      )}

      <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {server_error && <p className="text-sm text-destructive">{server_error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
