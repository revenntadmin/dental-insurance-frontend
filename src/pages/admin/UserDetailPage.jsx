import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function UserDetailPage() {
  const { user_id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();

  const user = useQuery({
    enabled: !!user_id,
    queryKey: ['admin', 'users', user_id],
    queryFn: () => api.get(`/api/admin/users/${user_id}`).then((r) => r.data),
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

  return (
    <div>
      <PageHeader title={u.email} description={`${u.role} · ${u.practice_name || 'no practice'}`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Name: {u.first_name} {u.last_name}</p>
            <p>Active: {u.active ? 'Yes' : 'No'}</p>
            <p>Created: {u.created_at}</p>
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
