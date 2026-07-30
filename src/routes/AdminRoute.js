import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }) {
  const { role, loading } = useAuth();

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : role === 'super_admin' ? (
        children
      ) : (
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
}
