import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/authNavigation';

export default function GuestRoute() {
  const { isAuthenticated, profile, mfaEnrolled, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (isAuthenticated) {
    if (!mfaEnrolled) {
      return <Navigate to="/mfa-enroll" replace />;
    }
    const path = dashboardPath(profile) || '/';
    return <Navigate to={path} replace />;
  }

  return <Outlet />;
}
