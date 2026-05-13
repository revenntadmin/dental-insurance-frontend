import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useToast } from '@/hooks/useToast';
import { api, api_error_message } from '@/lib/api_client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceField } from '@/components/ConfidenceField';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function IntakeSubmissionReviewPage() {
  const pid = useTenancyParam();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, set_form] = useState({});

  const { data, isLoading } = useQuery({
    enabled: !!pid && !!id,
    queryKey: ['practice', pid, 'intake_submissions', id],
    queryFn: () => api.get(`/api/practice/${pid}/intake_submissions/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (data?.fields) {
      const next = {};
      for (const [k, v] of Object.entries(data.fields)) next[k] = v.value ?? '';
      set_form(next);
    }
  }, [data]);

  const confirm = useMutation({
    mutationFn: () => api.put(`/api/practice/${pid}/intake_submissions/${id}/confirm`, { fields: form }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Patient created from submission');
      navigate(`/p/${pid}/intake-submissions`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  const discard = useMutation({
    mutationFn: () => api.put(`/api/practice/${pid}/intake_submissions/${id}/discard`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Submission discarded');
      navigate(`/p/${pid}/intake-submissions`);
    },
    onError: (e) => toast.error(api_error_message(e)),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Review intake submission"
        actions={
          <>
            <Button variant="outline" onClick={() => discard.mutate()} disabled={discard.isPending}>
              Discard
            </Button>
            <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>
              Confirm
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-6">
          {Object.entries(data?.fields || {}).map(([key, field]) => (
            <ConfidenceField
              key={key}
              name={key}
              label={key.replace(/_/g, ' ')}
              value={form[key] ?? ''}
              confidence={field.confidence}
              onChange={(v) => set_form((p) => ({ ...p, [key]: v }))}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
