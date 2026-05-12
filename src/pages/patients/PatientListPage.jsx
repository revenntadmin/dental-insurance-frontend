import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { usePatients } from '../../features/patients/queries.js';

export default function PatientListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = usePatients({ search });

  return (
    <div>
      <PageHeader
        title="Patients"
        actions={
          <>
            <Link to="/patients/import"><Button variant="secondary">Import CSV</Button></Link>
            <Link to="/patients/new"><Button>Add patient</Button></Link>
          </>
        }
      />

      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder="Search by name, DOB, or member ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : !data?.items?.length ? (
          <EmptyState
            title="No patients yet"
            description="Add patients manually, upload an insurance card, or import a CSV."
            action={<Link to="/patients/new"><Button>Add your first patient</Button></Link>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
              <tr>
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">DOB</th>
                <th className="px-5 py-2">Primary insurance</th>
                <th className="px-5 py-2">Last visit</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.patient_id} className="table-row">
                  <td className="px-5 py-2 font-medium">
                    <Link to={`/patients/${p.patient_id}`} className="hover:text-brand-700">
                      {p.last_name}, {p.first_name}
                    </Link>
                  </td>
                  <td className="px-5 py-2">{p.date_of_birth}</td>
                  <td className="px-5 py-2">{p.primary_insurance_carrier || '—'}</td>
                  <td className="px-5 py-2">{p.last_visit_date || '—'}</td>
                  <td className="px-5 py-2 text-right">
                    <Link to={`/patients/${p.patient_id}`} className="text-brand-600 hover:underline">
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
