import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { apiClient } from '../../lib/api_client.js';
import { usePracticeId } from '../../hooks/use_practice.js';

export default function ProviderListPage() {
  const practice_id = usePracticeId();
  const { data, isLoading, error } = useQuery({
    queryKey: ['providers', practice_id],
    enabled: !!practice_id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/practice/${practice_id}/providers`);
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Providers" subtitle="Rendering providers and their NPIs" />
      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? <EmptyState title="No providers" /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Name</th>
                  <th className="px-5 py-2">NPI</th>
                  <th className="px-5 py-2">Tax ID</th>
                  <th className="px-5 py-2">Specialty</th>
                  <th className="px-5 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.provider_id} className="table-row">
                    <td className="px-5 py-2 font-medium">{p.first_name} {p.last_name}</td>
                    <td className="px-5 py-2">{p.npi}</td>
                    <td className="px-5 py-2">{p.tax_id || '—'}</td>
                    <td className="px-5 py-2">{p.specialty || '—'}</td>
                    <td className="px-5 py-2">{p.is_active ? 'Yes' : 'No'}</td>
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
