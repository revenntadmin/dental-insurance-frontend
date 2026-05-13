import { format, parseISO, isValid } from 'date-fns';

export function format_money(amount, currency = 'USD') {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

export function format_date(value, fmt = 'MMM d, yyyy') {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? format(d, fmt) : '—';
}

export function format_datetime(value) {
  return format_date(value, 'MMM d, yyyy h:mm a');
}

export function format_phone_last_four(last_four) {
  return last_four ? `***-***-**${last_four}` : '***-***-****';
}

export const STATUS_COLORS = {
  // claim_status
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  validated: 'bg-blue-100 text-blue-700 border-blue-200',
  validation_failed: 'bg-red-100 text-red-700 border-red-200',
  submitted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  denied: 'bg-red-100 text-red-700 border-red-200',
  appealed: 'bg-amber-100 text-amber-800 border-amber-200',
  partial_paid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // appeal_status
  sent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  appeal_accepted: 'bg-green-100 text-green-700 border-green-200',
  appeal_denied: 'bg-red-100 text-red-700 border-red-200',
  // practice_status
  active: 'bg-green-100 text-green-700 border-green-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  // pre_procedure_status
  covered: 'bg-green-100 text-green-700 border-green-200',
  not_covered: 'bg-red-100 text-red-700 border-red-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // tx_status
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  in_flight: 'bg-blue-100 text-blue-700 border-blue-200',
  succeeded: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  // intake submissions
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  discarded: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function status_label(s) {
  if (!s) return '—';
  return s
    .toString()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function status_color(s) {
  return STATUS_COLORS[s] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function cn(...args) {
  return args.filter(Boolean).join(' ');
}
