import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { apiClient } from '../../lib/api_client.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function PracticesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_practices'],
    queryFn: async () => (await apiClient.get('/api/admin/practices')).data,
  });

  const [editing, setEditing] = useState(null);

  const regen = useMutation({
    mutationFn: async (practice_id) => (await apiClient.post(`/api/admin/practices/${practice_id}/intake_token/regenerate`)).data,
    onSuccess: () => {
      toast('Intake URL regenerated. The old link is now invalid.', 'success');
      qc.invalidateQueries({ queryKey: ['admin_practices'] });
    },
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  return (
    <div>
      <PageHeader title="Practices" subtitle="Manage your organization’s practices" />
      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? <EmptyState title="No practices" /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Name</th>
                  <th className="px-5 py-2">Tax ID</th>
                  <th className="px-5 py-2">Intake URL</th>
                  <th className="px-5 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.practice_id} className="table-row">
                    <td className="px-5 py-2 font-medium">{p.practice_name}</td>
                    <td className="px-5 py-2">{p.tax_id || '—'}</td>
                    <td className="px-5 py-2">
                      <code className="text-xs break-all">{p.intake_url}</code>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        onClick={() => regen.mutate(p.practice_id)}
                        className="text-sm text-brand-600 hover:underline mr-3"
                        disabled={regen.isPending}
                      >
                        Regenerate intake URL
                      </button>
                      <button onClick={() => setEditing(p)} className="text-sm text-brand-600 hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {editing && <EditPracticeModal practice={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditPracticeModal({ practice, onClose }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...practice });
  const save = useMutation({
    mutationFn: async () => (await apiClient.patch(`/api/admin/practices/${practice.practice_id}`, form)).data,
    onSuccess: () => {
      toast('Practice updated.', 'success');
      qc.invalidateQueries({ queryKey: ['admin_practices'] });
      onClose();
    },
    onError: (err) => toast(err.response?.data?.message || err.message, 'error'),
  });

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Edit practice</h2>
        <div className="space-y-3">
          <Input label="Practice name" value={form.practice_name || ''} onChange={(e) => setForm({ ...form, practice_name: e.target.value })} />
          <Input label="Tax ID" value={form.tax_id || ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
          <Input label="Import row limit" type="number" value={form.csv_import_row_limit || 5000} onChange={(e) => setForm({ ...form, csv_import_row_limit: Number(e.target.value) })} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}
