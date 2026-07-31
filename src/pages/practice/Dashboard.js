import { useTenancyGuard } from '../../hooks/useTenancyGuard';

export default function PracticeDashboard() {
  useTenancyGuard();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="empty-state">
        <p>Your practice workspace is ready. More features will appear here soon.</p>
      </div>
    </div>
  );
}
