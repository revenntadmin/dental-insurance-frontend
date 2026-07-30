import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EnrollRoute() {
  const { isAuthenticated, mfaEnrolled, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mfaEnrolled) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
