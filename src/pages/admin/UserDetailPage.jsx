import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const ROLES = ['practice_admin', 'coordinator', 'clearclaim_admin'];

export function UserDetailPage() {
  const { user_id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [edit_form, set_edit_form] = useState(null);

  const user = useQuery({
    enabled: !!user_id,
    queryKey: ['admin', 'users', user_id],
    queryFn: () => api.get(`/api/admin/users/${user_id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (user.data && !edit_form) {
      set_edit_form({
        first_name: user.data.first_name || '',
        last_name: user.data.last_name || '',
        role: user.data.role || '',
        is_active: user.data.active ?? true,
      });
    }
  }, [user.data]);

  const save = useMutation({
    mutationFn: (values) => api.put(`/api/admin/users/${user_id}`, values).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users', user_id] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const reset_mfa = useMutation({
    mutationFn: () => api.post(`/api/admin/users/${user_id}/reset_mfa`).then((r) => r.data),
    onSuccess: () => {
      toast.success('MFA reset for user');
      qc.invalidateQueries({ queryKey: ['admin', 'users', user_id] });
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const deactivate = useMutation({
    mutationFn: () => api.post(`/api/admin/users/${user_id}/deactivate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users', user_id] }),
  });

  const resend = useMutation({
    mutationFn: () => api.post(`/api/admin/users/${user_id}/resend_invite`).then((r) => r.data),
    onSuccess: () => toast.success('Invite re-sent'),
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (user.isLoading || !user.data) return <LoadingSpinner />;
  const u = user.data;

  function ef(key) {
    return {
      value: edit_form?.[key] ?? '',
      onChange: (e) => set_edit_form((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  return (
    <div>
      <PageHeader title={u.email} description={`${u.role} · ${u.practice_name || 'no practice'}`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" {...ef('first_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" {...ef('last_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={edit_form?.role ?? ''}
                  onChange={(e) => set_edit_form((p) => ({ ...p, role: e.target.value }))}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={edit_form?.is_active ?? true}
                  onChange={(e) => set_edit_form((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Created: {u.created_at}</p>
            <div className="flex justify-end">
              <Button onClick={() => save.mutate(edit_form)} disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">MFA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{u.mfa_enrolled ? `Enrolled — ends in ${u.mfa_phone_last_4}` : 'Not enrolled'}</p>
            <Button variant="outline" onClick={() => reset_mfa.mutate()}>
              Reset MFA
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-x-2">
            {!u.first_login_at && (
              <Button variant="outline" onClick={() => resend.mutate()}>
                Resend invite
              </Button>
            )}
            <Button variant="destructive" onClick={() => deactivate.mutate()}>
              Deactivate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
