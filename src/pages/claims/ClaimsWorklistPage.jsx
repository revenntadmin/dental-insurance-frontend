import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { useClaims } from '../../features/claims/queries.js';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'paid', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
];

export default function ClaimsWorklistPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useClaims({ status: status || undefined });

  return (
    <div>
      <PageHeader
        title="Claims"
        actions={<Link to="/claims/new"><Button>New claim</Button></Link>}
      />

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatus(f.value)}
            className={`px-3 py-1.5 rounded text-sm ${status === f.value ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? (
            <EmptyState title="No claims" description="Submitted and in-progress claims will appear here." />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Service date</th>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">CDT codes</th>
                  <th className="px-5 py-2">Carrier</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2">Amount</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.claim_id} className="table-row">
                    <td className="px-5 py-2">{c.service_date}</td>
                    <td className="px-5 py-2">{c.patient_name}</td>
                    <td className="px-5 py-2">{c.cdt_codes?.join(', ')}</td>
                    <td className="px-5 py-2">{c.carrier_name}</td>
                    <td className="px-5 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-2">${((c.billed_amount_cents || 0) / 100).toLocaleString()}</td>
                    <td className="px-5 py-2 text-right">
                      <Link to={`/claims/${c.claim_id}`} className="text-brand-600 hover:underline">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
