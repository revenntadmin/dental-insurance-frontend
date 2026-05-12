import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import {
  useDashboardMetrics,
  useDashboardWorklist,
  useDashboardAlerts,
} from '../../features/dashboard/queries.js';

function MetricCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value ?? '—'}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const metrics = useDashboardMetrics();
  const worklist = useDashboardWorklist();
  const alerts = useDashboardAlerts();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today’s view of your claims, denials, and intake activity"
      />

      {alerts.data?.intake_submissions_pending > 0 && (
        <Link
          to="/patients/intake-submissions"
          className="block mb-4 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm hover:bg-amber-100"
        >
          You have <strong>{alerts.data.intake_submissions_pending}</strong> patient intake
          submission(s) waiting for review.
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Claims open" value={metrics.data?.claims_open} />
        <MetricCard label="Denied (30d)" value={metrics.data?.denied_30d} />
        <MetricCard label="Paid (30d)" value={metrics.data?.paid_30d_amount_cents != null ? `$${(metrics.data.paid_30d_amount_cents / 100).toLocaleString()}` : '—'} />
        <MetricCard label="Avg days to pay" value={metrics.data?.avg_days_to_pay} />
      </div>

      <div className="card">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold">Worklist</h2>
          <Link to="/claims" className="text-sm text-brand-600 hover:underline">View all claims →</Link>
        </div>

        {worklist.isLoading ? (
          <LoadingState />
        ) : worklist.error ? (
          <ErrorState error={worklist.error} />
        ) : !worklist.data?.items?.length ? (
          <EmptyState title="Worklist clear" description="No items need attention right now." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
              <tr>
                <th className="px-5 py-2">Patient</th>
                <th className="px-5 py-2">Type</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">Age</th>
                <th className="px-5 py-2">Amount</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {worklist.data.items.map((item) => (
                <tr key={item.item_id} className="table-row">
                  <td className="px-5 py-2">{item.patient_name}</td>
                  <td className="px-5 py-2">{item.item_type}</td>
                  <td className="px-5 py-2"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-2">{item.age_days}d</td>
                  <td className="px-5 py-2">
                    {item.amount_cents != null ? `$${(item.amount_cents / 100).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-2 text-right">
                    <Link
                      to={item.item_type === 'claim' ? `/claims/${item.item_id}` : `/pre-procedure/${item.item_id}`}
                      className="text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
