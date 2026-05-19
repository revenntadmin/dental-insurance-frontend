import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, AlertCircle, Receipt, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api_client';
import { useTenancyParam } from '@/hooks/useTenancyParam';
import { useAuth } from '@/features/auth/useAuth';
import { format_money } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';

export function DashboardPage() {
  const pid = useTenancyParam();
  const { profile } = useAuth();

  const metrics = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'metrics', '30d'],
    queryFn: () => api.get(`/api/practice/${pid}/metrics`, { params: { period: '30d' } }).then((r) => r.data),
  });
  const alerts = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'alerts'],
    queryFn: () => api.get(`/api/practice/${pid}/alerts`).then((r) => r.data),
  });
  const eras = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'era_receipts', { limit: 5 }],
    queryFn: () => api.get(`/api/practice/${pid}/era_receipts`, { params: { limit: 5 } }).then((r) => r.data),
  });
  const intake = useQuery({
    enabled: !!pid,
    queryKey: ['practice', pid, 'intake_submissions', { status: 'pending_review' }],
    queryFn: () =>
      api
        .get(`/api/practice/${pid}/intake_submissions`, { params: { status: 'pending_review', limit: 1 } })
        .then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{profile?.practice_name || 'Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMM d, yyyy')}</p>
        </div>
        <Link to={`/p/${pid}/claims/new`}>
          <Button>New Claim</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Billed (30d)"
          value={format_money(metrics.data?.billed_30d)}
          loading={metrics.isLoading}
        />
        <Kpi
          label="Pending"
          value={format_money(metrics.data?.pending)}
          loading={metrics.isLoading}
        />
        <Kpi
          label="Denials needing action"
          value={metrics.data?.denials_needing_action ?? '—'}
          loading={metrics.isLoading}
        />
        <Kpi
          label="Clean-claim rate"
          value={metrics.data?.clean_claim_rate != null ? `${Math.round(metrics.data.clean_claim_rate * 100)}%` : '—'}
          loading={metrics.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.isLoading ? (
              <LoadingSpinner />
            ) : (alerts.data?.length ?? 0) === 0 ? (
              <EmptyState title="You're all caught up" description="No claims need attention right now." />
            ) : (
              <ul className="divide-y">
                {alerts.data.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <Link to={`/p/${pid}/claims/${a.id}`} className="font-medium hover:underline">
                        {a.patient_name}
                      </Link>{' '}
                      <span className="text-muted-foreground">· {a.reason}</span>
                    </span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" /> Pending intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intake.data?.total ?? 0}</div>
            <Link to={`/p/${pid}/intake-submissions`} className="mt-3 inline-flex items-center text-sm text-primary">
              Review queue <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" /> Recent ERAs
          </CardTitle>
          <Link to={`/p/${pid}/era-receipts`} className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {eras.isLoading ? (
            <LoadingSpinner />
          ) : (eras.data?.length ?? 0) === 0 ? (
            <EmptyState title="No ERAs yet" />
          ) : (
            <ul className="divide-y">
              {eras.data.map((era) => (
                <li key={era.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/p/${pid}/era-receipts/${era.id}`} className="hover:underline">
                    {era.payer_name} · #{era.check_number}
                  </Link>
                  <span>{format_money(era.total_paid)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, loading }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{loading ? '—' : value}</p>
      </CardContent>
    </Card>
  );
}
