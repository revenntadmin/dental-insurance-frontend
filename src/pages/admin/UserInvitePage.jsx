import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function UserInvitePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, set_form] = useState({
    email: '',
    role: 'billing_coordinator',
    first_name: '',
    last_name: '',
    practice_id: '',
  });
  const [sent_to, set_sent_to] = useState(null);

  const practices = useQuery({
    queryKey: ['admin', 'practices'],
    queryFn: () => api.get('/api/admin/practices').then((r) => r.data),
  });

  const invite = useMutation({
    mutationFn: () => api.post('/api/admin/users', form).then((r) => r.data),
    onSuccess: () => {
      set_sent_to(form.email);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (sent_to) {
    return (
      <div>
        <PageHeader title="Invitation sent" />
        <Card>
          <CardContent className="p-6 text-sm">
            <p>Welcome email sent to {sent_to}.</p>
            <Button className="mt-4" onClick={() => navigate('/admin/users')}>
              Back to users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Invite user" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set_form((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.role}
              onChange={(e) => set_form((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="billing_coordinator">Billing coordinator</option>
              <option value="practice_owner">Practice owner</option>
              <option value="clearclaim_admin">ClearClaim admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" value={form.first_name} onChange={(e) => set_form((f) => ({ ...f, first_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={form.last_name} onChange={(e) => set_form((f) => ({ ...f, last_name: e.target.value }))} />
          </div>
          {form.role !== 'clearclaim_admin' && (
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="practice_id">Practice</Label>
              <select
                id="practice_id"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.practice_id}
                onChange={(e) => set_form((f) => ({ ...f, practice_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {(practices.data || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => invite.mutate()} disabled={invite.isPending}>
          {invite.isPending ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
    </div>
  );
}
