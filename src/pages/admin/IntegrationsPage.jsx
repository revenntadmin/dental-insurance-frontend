import { useMutation } from '@tanstack/react-query';
import { Plug, FlaskConical } from 'lucide-react';
import { api, api_error_message } from '@/lib/api_client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  { key: 'ai_model', title: 'AI Model', test: '/api/admin/health/ai' },
  { key: 'clearinghouse', title: 'Clearinghouse', test: '/api/admin/health/clearinghouse' },
  { key: 'gcs', title: 'GCS storage', test: '/api/admin/health/gcs' },
  { key: 'smtp', title: 'SMTP', test: '/api/admin/health/smtp' },
];

export function IntegrationsPage() {
  return (
    <div>
      <PageHeader title="Integrations" description="Connection settings managed via system configs." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <Section key={s.key} title={s.title} test_url={s.test} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, test_url }) {
  const toast = useToast();
  const test = useMutation({
    mutationFn: () => api.post(test_url).then((r) => r.data),
    onSuccess: (d) => toast.success(`${title} OK${d?.latency_ms ? ` (${d.latency_ms} ms)` : ''}`),
    onError: (e) => toast.error(api_error_message(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plug className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">Update related values from System Config.</p>
        <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
          <FlaskConical className="mr-2 h-4 w-4" />
          {test.isPending ? 'Testing…' : 'Test connection'}
        </Button>
      </CardContent>
    </Card>
  );
}
