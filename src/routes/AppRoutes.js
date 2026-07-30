import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import MfaVerify from '../pages/MfaVerify';
import MfaEnroll from '../pages/MfaEnroll';
import MfaEnrollVerify from '../pages/MfaEnrollVerify';
import AuthAction from '../pages/AuthAction';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPracticeDetail from '../pages/admin/AdminPracticeDetail';
import NotFound from '../pages/NotFound';
import GuestRoute from './GuestRoute';
import EnrollRoute from './EnrollRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/mfa-verify" element={<MfaVerify />} />
      </Route>

      <Route element={<EnrollRoute />}>
        <Route path="/mfa-enroll" element={<MfaEnroll />} />
        <Route path="/mfa-enroll/verify" element={<MfaEnrollVerify />} />
      </Route>

      <Route path="/auth/action" element={<AuthAction />} />

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
