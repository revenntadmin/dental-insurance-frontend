import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute({ children, requirePhoneEnrolled = true }) {
  const { user, loading, phoneEnrolled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requirePhoneEnrolled && !phoneEnrolled) {
    return <Navigate to="/enroll-phone" replace />;
  }

  return children;
}
