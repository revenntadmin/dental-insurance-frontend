import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, mfaEnrolled } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!mfaEnrolled) {
    return <Navigate to="/mfa-enroll" replace />;
  }

  return <AppShell>{children}</AppShell>;
}
