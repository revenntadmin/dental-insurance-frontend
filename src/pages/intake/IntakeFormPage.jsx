import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api_client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const SECTIONS = [
  {
    key: 'personal',
    title: 'Personal',
    fields: [
      { name: 'first_name', label: 'First name', required: true },
      { name: 'last_name', label: 'Last name', required: true },
      { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true },
      { name: 'sex', label: 'Sex' },
    ],
  },
  {
    key: 'address',
    title: 'Address',
    fields: [
      { name: 'address_line_1', label: 'Street' },
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State' },
      { name: 'postal_code', label: 'Postal code' },
    ],
  },
  {
    key: 'contact',
    title: 'Phone & email',
    fields: [
      { name: 'phone', label: 'Mobile phone', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
  },
  {
    key: 'primary',
    title: 'Primary insurance',
    fields: [
      { name: 'primary_payer_name', label: 'Insurance company' },
      { name: 'primary_member_id', label: 'Member ID' },
      { name: 'primary_group_number', label: 'Group #' },
      { name: 'primary_subscriber_name', label: 'Subscriber name' },
    ],
  },
];

export function IntakeFormPage() {
  const { intake_token } = useParams();
  const navigate = useNavigate();
  const [form, set_form] = useState({});
  const [include_secondary, set_include_secondary] = useState(false);
  const [error, set_error] = useState(null);

  const intake = useQuery({
    enabled: !!intake_token,
    queryKey: ['intake', intake_token],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/intake/${intake_token}`);
        return data;
      } catch (err) {
        if (err?.response?.status === 410 || err?.response?.status === 404) {
          navigate('/intake/not-found', { replace: true });
        }
        throw err;
      }
    },
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () => api.post(`/api/intake/${intake_token}`, form).then((r) => r.data),
    onSuccess: () => navigate(`/intake/${intake_token}/submitted`),
    onError: (err) => set_error(err?.response?.data?.message || 'Submission failed.'),
  });

  useEffect(() => {
    set_error(null);
  }, [form]);

  if (intake.isLoading) return <LoadingSpinner />;
  if (intake.isError) return null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        {intake.data?.practice_logo_url && (
          <img src={intake.data.practice_logo_url} alt="" className="mx-auto h-12" />
        )}
        <h1 className="mt-2 text-lg font-semibold">{intake.data?.practice_name}</h1>
        <p className="text-sm text-muted-foreground">New patient intake</p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {SECTIONS.map((s) => (
            <Section key={s.key} section={s} form={form} set_form={set_form} />
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={include_secondary}
              onChange={(e) => set_include_secondary(e.target.checked)}
            />
            I have secondary insurance
          </label>
          {include_secondary && (
            <Section
              section={{
                title: 'Secondary insurance',
                fields: [
                  { name: 'secondary_payer_name', label: 'Insurance company' },
                  { name: 'secondary_member_id', label: 'Member ID' },
                  { name: 'secondary_group_number', label: 'Group #' },
                ],
              }}
              form={form}
              set_form={set_form}
            />
          )}

          <Section
            section={{
              title: 'Emergency contact (optional)',
              fields: [
                { name: 'emergency_contact_name', label: 'Name' },
                { name: 'emergency_contact_phone', label: 'Phone', type: 'tel' },
              ],
            }}
            form={form}
            set_form={set_form}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ section, form, set_form }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{section.title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {section.fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>
              {f.label}
              {f.required && ' *'}
            </Label>
            <Input
              id={f.name}
              type={f.type || 'text'}
              value={form[f.name] || ''}
              onChange={(e) => set_form((p) => ({ ...p, [f.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
