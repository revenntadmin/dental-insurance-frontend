import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { usePreProcedures } from '../../features/claims/queries.js';

export default function PreProcedureListPage() {
  const { data, isLoading, error } = usePreProcedures();

  return (
    <div>
      <PageHeader
        title="Pre-procedure"
        subtitle="Predeterminations and benefit checks before treatment"
      />
      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? <EmptyState title="No pre-procedure checks" /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Planned</th>
                  <th className="px-5 py-2">Procedures</th>
                  <th className="px-5 py-2">Estimated patient owes</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.pre_procedure_id} className="table-row">
                    <td className="px-5 py-2">{p.patient_name}</td>
                    <td className="px-5 py-2">{p.planned_date}</td>
                    <td className="px-5 py-2">{p.cdt_codes?.join(', ')}</td>
                    <td className="px-5 py-2">${((p.patient_responsibility_cents || 0) / 100).toLocaleString()}</td>
                    <td className="px-5 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-2 text-right">
                      <Link to={`/pre-procedure/${p.pre_procedure_id}`} className="text-brand-600 hover:underline">Open</Link>
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
