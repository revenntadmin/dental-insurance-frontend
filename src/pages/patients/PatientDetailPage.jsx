import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { usePatient } from '../../features/patients/queries.js';

export default function PatientDetailPage() {
  const { patient_id } = useParams();
  const { data, isLoading, error } = usePatient(patient_id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={`${data.last_name}, ${data.first_name}`}
        subtitle={`DOB ${data.date_of_birth} · ${data.email || ''}`}
        actions={
          <>
            <Link to={`/patients/${patient_id}/insurance`}><Button variant="secondary">Edit insurance</Button></Link>
            <Link to={`/claims/new?patient_id=${patient_id}`}><Button>New claim</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-1">
          <h3 className="font-semibold mb-3">Demographics</h3>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{data.phone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{data.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Address</dt><dd className="text-right">{data.address_line1 || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Gender</dt><dd>{data.gender || '—'}</dd></div>
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Insurance</h3>
          {!data.insurance_policies?.length ? (
            <p className="text-sm text-slate-500">No insurance on file.</p>
          ) : (
            <ul className="space-y-3">
              {data.insurance_policies.map((pol) => (
                <li key={pol.policy_id} className="border border-slate-200 rounded p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{pol.carrier_name} · {pol.plan_name}</div>
                    <StatusBadge status={pol.eligibility_status} />
                  </div>
                  <div className="text-slate-500 mt-1">
                    Member {pol.member_id} · Group {pol.group_number || '—'} · {pol.relationship_to_subscriber || 'self'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 lg:col-span-3">
          <h3 className="font-semibold mb-3">Recent claims</h3>
          {!data.recent_claims?.length ? (
            <p className="text-sm text-slate-500">No claims yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Service date</th>
                  <th className="py-2">CDT codes</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.recent_claims.map((c) => (
                  <tr key={c.claim_id} className="border-t border-slate-100">
                    <td className="py-2">{c.service_date}</td>
                    <td className="py-2">{c.cdt_codes?.join(', ')}</td>
                    <td className="py-2"><StatusBadge status={c.status} /></td>
                    <td className="py-2">${((c.billed_amount_cents || 0) / 100).toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <Link to={`/claims/${c.claim_id}`} className="text-brand-600 hover:underline">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
