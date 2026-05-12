import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { apiClient } from '../../lib/api_client.js';
import { useToast } from '../../hooks/use_toast.jsx';

const ROLES = ['owner', 'admin', 'biller', 'front_desk', 'provider', 'read_only'];

export default function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => (await apiClient.get('/api/admin/users')).data,
  });

  const updateRole = useMutation({
    mutationFn: async ({ user_id, role }) => (await apiClient.patch(`/api/admin/users/${user_id}`, { role })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_users'] }),
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  const deactivate = useMutation({
    mutationFn: async (user_id) => (await apiClient.delete(`/api/admin/users/${user_id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast('User deactivated.', 'success');
    },
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        actions={<Button onClick={() => setInviteOpen(true)}>Invite user</Button>}
      />

      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? <EmptyState title="No users" /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Email</th>
                  <th className="px-5 py-2">Name</th>
                  <th className="px-5 py-2">Role</th>
                  <th className="px-5 py-2">MFA</th>
                  <th className="px-5 py-2">Last login</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.user_id} className="table-row">
                    <td className="px-5 py-2">{u.email}</td>
                    <td className="px-5 py-2">{u.first_name} {u.last_name}</td>
                    <td className="px-5 py-2">
                      <select
                        className="input py-1 text-xs"
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ user_id: u.user_id, role: e.target.value })}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-2">{u.phone_enrolled ? 'Yes' : <span className="text-amber-600">Pending</span>}</td>
                    <td className="px-5 py-2">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</td>
                    <td className="px-5 py-2 text-right">
                      <button onClick={() => deactivate.mutate(u.user_id)} className="text-red-600 hover:underline text-sm">Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function InviteUserModal({ open, onClose }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', role: 'biller' });

  const invite = useMutation({
    mutationFn: async () => (await apiClient.post('/api/admin/users/invite', form)).data,
    onSuccess: () => {
      toast('Invitation sent.', 'success');
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      onClose();
    },
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite user"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => invite.mutate()} disabled={invite.isPending || !form.email}>
            {invite.isPending ? 'Sending…' : 'Send invitation'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>
    </Modal>
  );
}
