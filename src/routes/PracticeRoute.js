import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PracticeShell from '../components/PracticeShell';
import { dashboardPath, isSuperAdmin } from '../lib/authNavigation';

export default function PracticeRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (isSuperAdmin(profile)) {
    return <Navigate to={dashboardPath(profile)} replace />;
  }

  if (!profile?.practice_id) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PracticeShell>
      <Outlet />
    </PracticeShell>
  );
}
