import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirm_password_reset } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    password: z.string().min(12, 'At least 12 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ['confirm'] });

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const oob_code = search.get('oobCode');
  const [submitting, set_submitting] = useState(false);
  const [error, set_error] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  async function on_submit(values) {
    set_submitting(true);
    set_error(null);
    try {
      await confirm_password_reset(oob_code, values.password);
      navigate('/auth/login');
    } catch {
      set_error('Could not reset password. The link may have expired.');
    } finally {
      set_submitting(false);
    }
  }

  if (!oob_code) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Invalid link</h1>
        <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>
      <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
