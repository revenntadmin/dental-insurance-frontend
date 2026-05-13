import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function PracticeOnboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, set_step] = useState(1);
  const [practice, set_practice] = useState({
    name: '', npi: '', tax_id: '', address_line_1: '', city: '', state: '', postal_code: '',
  });
  const [stedi, set_stedi] = useState({ enrolled: false, payer_ids: '' });
  const [first_user, set_first_user] = useState({ email: '', role: 'practice_owner', first_name: '', last_name: '' });
  const [created_id, set_created_id] = useState(null);

  const create_practice = useMutation({
    mutationFn: () => api.post('/api/admin/practices', { ...practice, stedi }).then((r) => r.data),
    onSuccess: (data) => set_created_id(data.id),
    onError: (e) => toast.error(api_error_message(e)),
  });

  const create_user = useMutation({
    mutationFn: () =>
      api.post('/api/admin/users', { ...first_user, practice_id: created_id }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Practice onboarded — welcome email sent');
      navigate(`/admin/practices/${created_id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title="Onboard new practice" description={`Step ${step} of 4`} />
      <Card>
        <CardContent className="space-y-4 p-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(practice).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k}>{k.replace(/_/g, ' ')}</Label>
                  <Input id={k} value={practice[k]} onChange={(e) => set_practice((p) => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={stedi.enrolled}
                  onChange={(e) => set_stedi((s) => ({ ...s, enrolled: e.target.checked }))}
                />
                Enroll with Stedi clearinghouse now
              </label>
              <div className="space-y-1.5">
                <Label htmlFor="payer_ids">Payer IDs (comma separated)</Label>
                <Input id="payer_ids" value={stedi.payer_ids} onChange={(e) => set_stedi((s) => ({ ...s, payer_ids: e.target.value }))} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {['email', 'first_name', 'last_name'].map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k}>{k.replace(/_/g, ' ')}</Label>
                  <Input id={k} value={first_user[k]} onChange={(e) => set_first_user((p) => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={first_user.role}
                  onChange={(e) => set_first_user((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="practice_owner">Practice owner</option>
                  <option value="billing_coordinator">Billing coordinator</option>
                </select>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Review</p>
              <p>Practice: {practice.name}</p>
              <p>Stedi enrolled: {stedi.enrolled ? 'Yes' : 'No'}</p>
              <p>
                First user: {first_user.email} ({first_user.role})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={() => set_step((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => set_step((s) => s + 1)}>Next</Button>
        ) : (
          <Button
            onClick={async () => {
              const result = await create_practice.mutateAsync();
              if (result?.id) await create_user.mutateAsync();
            }}
            disabled={create_practice.isPending || create_user.isPending}
          >
            Create practice
          </Button>
        )}
      </div>
    </div>
  );
}
