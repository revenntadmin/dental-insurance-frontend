import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  npi: z.string().regex(/^\d{10}$/, 'NPI must be 10 digits'),
  license_number: z.string().optional(),
  specialty: z.string().optional(),
  active: z.boolean().default(true),
});

export function ProviderEditPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const is_new = !id;
  const [defaults, set_defaults] = useState({ active: true });

  const detail = useQuery({
    enabled: !!id && !!pid,
    queryKey: ['practice', pid, 'providers', id],
    queryFn: () => api.get(`/api/practice/${pid}/providers/${id}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (detail.data) {
      set_defaults(detail.data);
      reset(detail.data);
    }
  }, [detail.data, reset]);

  const save = useMutation({
    mutationFn: (values) =>
      is_new
        ? api.post(`/api/practice/${pid}/providers`, values).then((r) => r.data)
        : api.put(`/api/practice/${pid}/providers/${id}`, values).then((r) => r.data),
    onSuccess: () => {
      toast.success(is_new ? 'Provider created' : 'Provider saved');
      navigate(`/p/${pid}/providers`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title={is_new ? 'New provider' : 'Edit provider'} />
      <form onSubmit={handleSubmit(save.mutate)}>
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" defaultValue={defaults.first_name} {...register('first_name')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" defaultValue={defaults.last_name} {...register('last_name')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="npi">NPI</Label>
              <Input id="npi" defaultValue={defaults.npi} maxLength={10} {...register('npi')} />
              {errors.npi && <p className="text-xs text-destructive">{errors.npi.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license_number">License #</Label>
              <Input id="license_number" defaultValue={defaults.license_number} {...register('license_number')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specialty">Specialty</Label>
              <Input id="specialty" defaultValue={defaults.specialty} {...register('specialty')} />
            </div>
            <div className="flex items-end gap-2">
              <input
                type="checkbox"
                id="active"
                defaultChecked={defaults.active !== false}
                {...register('active')}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/p/${pid}/providers`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
