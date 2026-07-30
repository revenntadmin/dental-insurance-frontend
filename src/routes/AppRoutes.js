import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import MfaEnroll from '../pages/MfaEnroll';
import AuthAction from '../pages/AuthAction';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPracticeDetail from '../pages/admin/AdminPracticeDetail';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/action" element={<AuthAction />} />
      <Route
        path="/mfa-enroll"
        element={
          <ProtectedRoute>
            <MfaEnroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/practice/:id"
        element={
          <AdminRoute>
            <AdminPracticeDetail />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
