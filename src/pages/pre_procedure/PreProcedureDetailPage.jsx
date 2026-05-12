import { useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import { usePreProcedure } from '../../features/claims/queries.js';

export default function PreProcedureDetailPage() {
  const { pre_procedure_id } = useParams();
  const { data, isLoading, error } = usePreProcedure(pre_procedure_id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="Pre-procedure result"
        subtitle={`${data.patient_name} · planned ${data.planned_date}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            Coverage <StatusBadge status={data.status} />
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Carrier" value={data.carrier_name} />
            <Item label="Plan" value={data.plan_name} />
            <Item label="Annual maximum remaining" value={cents(data.annual_max_remaining_cents)} />
            <Item label="Deductible remaining" value={cents(data.deductible_remaining_cents)} />
            <Item label="Estimated insurance pays" value={cents(data.estimated_insurance_cents)} />
            <Item label="Estimated patient owes" value={cents(data.patient_responsibility_cents)} />
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Procedures</h3>
          <ul className="text-sm space-y-2">
            {data.procedures?.map((p, i) => (
              <li key={i} className="border border-slate-200 rounded p-2">
                <div className="font-medium">{p.cdt_code}</div>
                <div className="text-slate-500">{p.description}</div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Fee</span>
                  <span>{cents(p.fee_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Covered at</span>
                  <span>{p.coverage_percent != null ? `${p.coverage_percent}%` : '—'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {data.notes && (
          <div className="card p-5 lg:col-span-3">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5">{value ?? '—'}</dd>
    </div>
  );
}

function cents(v) { return v != null ? `$${(v / 100).toLocaleString()}` : '—'; }
