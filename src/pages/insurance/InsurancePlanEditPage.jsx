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
  payer_name: z.string().min(1, 'Required'),
  payer_id: z.string().regex(/^\d{5}$/, 'Must be 5 digits'),
  payer_address: z.string().optional(),
  payer_phone: z.string().optional(),
});

export function InsurancePlanEditPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const is_new = !id;
  const [defaults, set_defaults] = useState({});

  const detail = useQuery({
    enabled: !!id && !!pid,
    queryKey: ['practice', pid, 'insurance_plans', id],
    queryFn: () => api.get(`/api/practice/${pid}/insurance_plans/${id}`).then((r) => r.data),
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
        ? api.post(`/api/practice/${pid}/insurance_plans`, values).then((r) => r.data)
        : api.put(`/api/practice/${pid}/insurance_plans/${id}`, values).then((r) => r.data),
    onSuccess: () => {
      toast.success(is_new ? 'Plan created' : 'Plan saved');
      navigate(`/p/${pid}/insurance-plans`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <div>
      <PageHeader title={is_new ? 'New insurance plan' : 'Edit insurance plan'} />
      <form onSubmit={handleSubmit(save.mutate)}>
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="payer_name">Payer name</Label>
              <Input id="payer_name" defaultValue={defaults.payer_name} {...register('payer_name')} />
              {errors.payer_name && <p className="text-xs text-destructive">{errors.payer_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payer_id">Payer ID</Label>
              <Input id="payer_id" defaultValue={defaults.payer_id} {...register('payer_id')} />
              {errors.payer_id && <p className="text-xs text-destructive">{errors.payer_id.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="payer_address">Payer address</Label>
              <Input id="payer_address" defaultValue={defaults.payer_address} {...register('payer_address')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payer_phone">Payer phone</Label>
              <Input id="payer_phone" defaultValue={defaults.payer_phone} {...register('payer_phone')} />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/p/${pid}/insurance-plans`)}>
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
