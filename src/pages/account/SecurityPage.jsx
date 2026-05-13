import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { change_password, logout } from '@/lib/auth';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function SecurityPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [current, set_current] = useState('');
  const [next, set_next] = useState('');
  const [confirm_open, set_confirm_open] = useState(false);

  const change = useMutation({
    mutationFn: () => change_password(current, next),
    onSuccess: () => {
      toast.success('Password changed');
      set_current('');
      set_next('');
    },
    onError: () => toast.error('Could not change password. Check your current password.'),
  });

  const reset_mfa = useMutation({
    mutationFn: () => api.post('/api/me/mfa/reset').then((r) => r.data),
    onSuccess: async () => {
      toast.success('MFA reset — please sign in again');
      await logout();
      navigate('/auth/login?reason=mfa_required');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title="Security" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" value={current} onChange={(e) => set_current(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">New password</Label>
              <Input id="next" type="password" value={next} onChange={(e) => set_next(e.target.value)} />
            </div>
            <Button onClick={() => change.mutate()} disabled={!current || next.length < 12 || change.isPending}>
              {change.isPending ? 'Saving…' : 'Update password'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multi-factor authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {profile?.mfa_enrolled
                ? `Enrolled — ends in ${profile.mfa_phone_last_4 || '????'}`
                : 'Not enrolled'}
            </p>
            <Button variant="destructive" onClick={() => set_confirm_open(true)} disabled={reset_mfa.isPending}>
              Reset MFA
            </Button>
            <Dialog open={confirm_open} onOpenChange={set_confirm_open}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset MFA?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This will remove your phone factor. You will be required to enroll a new phone number on your next login. Continue?
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => set_confirm_open(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={reset_mfa.isPending}
                    onClick={() => { set_confirm_open(false); reset_mfa.mutate(); }}
                  >
                    {reset_mfa.isPending ? 'Resetting…' : 'Reset'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
