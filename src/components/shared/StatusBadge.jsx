const STYLES = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  denied: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  needs_review: 'bg-amber-100 text-amber-700',
  pending_review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-slate-200 text-slate-600',
  ready: 'bg-emerald-100 text-emerald-700',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const cls = STYLES[key] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
