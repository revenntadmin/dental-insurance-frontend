import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ProtectedRoute({ children, admin_only = false }) {
  const { user, profile, is_admin, is_loading, mfa_enrolled } = useAuth();
  const location = useLocation();

  if (is_loading) return <LoadingSpinner label="Verifying your session…" />;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location }} />;
  if (!mfa_enrolled) return <Navigate to="/auth/enroll-phone" replace />;
  if (admin_only && profile && !is_admin) return <Navigate to="/auth/access-denied" replace />;
  return children;
}
