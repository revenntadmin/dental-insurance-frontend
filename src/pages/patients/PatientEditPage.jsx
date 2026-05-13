import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { usePatient } from '@/features/patients/usePatient';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function PatientEditPage() {
  const pid = useTenancyParam();
  const { patient_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading } = usePatient(pid, patient_id);
  const [form, set_form] = useState({});

  useEffect(() => {
    if (data) set_form(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put(`/api/practice/${pid}/patients/${patient_id}`, form).then((r) => r.data),
    onSuccess: () => {
      toast.success('Patient updated');
      navigate(`/p/${pid}/patients/${patient_id}`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (isLoading) return <LoadingSpinner />;

  function f(name) {
    return {
      id: name,
      value: form[name] ?? '',
      onChange: (e) => set_form((p) => ({ ...p, [name]: e.target.value })),
    };
  }

  return (
    <div>
      <PageHeader title="Edit patient" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          {['first_name', 'last_name', 'date_of_birth', 'sex', 'phone', 'email', 'address_line_1', 'city', 'state', 'postal_code', 'chart_number'].map(
            (name) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{name.replace(/_/g, ' ')}</Label>
                <Input {...f(name)} type={name === 'date_of_birth' ? 'date' : 'text'} />
              </div>
            ),
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
