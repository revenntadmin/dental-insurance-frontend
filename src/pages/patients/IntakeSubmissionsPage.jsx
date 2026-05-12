import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState, { ErrorState } from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ManualEntryForm from './entry/ManualEntryForm.jsx';
import { useIntakeSubmissions, useConfirmIntakeSubmission } from '../../features/patients/queries.js';
import { useToast } from '../../hooks/use_toast.jsx';

export default function IntakeSubmissionsPage() {
  const { data, isLoading, error, refetch } = useIntakeSubmissions('pending_review');
  const confirm = useConfirmIntakeSubmission();
  const { toast } = useToast();
  const [active, setActive] = useState(null);

  async function onConfirm(body) {
    try {
      await confirm.mutateAsync({ submission_id: active.submission_id, body });
      toast('Patient created from submission.', 'success');
      setActive(null);
      refetch();
    } catch (err) {
      toast(err.response?.data?.message || err.message, 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Intake submissions"
        subtitle="Patient self-service forms awaiting front-desk review"
      />

      <div className="card">
        {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> :
          !data?.items?.length ? (
            <EmptyState title="No submissions to review" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-5 py-2">Submitted</th>
                  <th className="px-5 py-2">Name</th>
                  <th className="px-5 py-2">DOB</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.submission_id} className="table-row">
                    <td className="px-5 py-2">{new Date(s.submitted_at).toLocaleString()}</td>
                    <td className="px-5 py-2">{s.patient?.last_name}, {s.patient?.first_name}</td>
                    <td className="px-5 py-2">{s.patient?.date_of_birth}</td>
                    <td className="px-5 py-2"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-2 text-right">
                      <Button variant="secondary" onClick={() => setActive(s)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Review and confirm submission">
        {active && (
          <ManualEntryForm
            initial={{ patient: active.patient, insurance: active.insurance, confidence: active.confidence || {} }}
            onSubmit={onConfirm}
            busy={confirm.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
