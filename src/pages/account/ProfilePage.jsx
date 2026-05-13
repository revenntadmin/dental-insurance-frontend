import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ProfilePage() {
  const { profile, refresh_profile } = useAuth();
  const toast = useToast();
  const [form, set_form] = useState({ first_name: '', last_name: '' });

  useEffect(() => {
    if (profile) set_form({ first_name: profile.first_name || '', last_name: profile.last_name || '' });
  }, [profile]);

  const save = useMutation({
    mutationFn: () => api.put('/api/me/profile', form).then((r) => r.data),
    onSuccess: async () => {
      toast.success('Profile updated');
      await refresh_profile();
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title="Profile" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" value={form.first_name} onChange={(e) => set_form((p) => ({ ...p, first_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={form.last_name} onChange={(e) => set_form((p) => ({ ...p, last_name: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
