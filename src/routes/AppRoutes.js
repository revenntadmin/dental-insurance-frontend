import { Navigate, Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';
import MfaVerify from '../pages/MfaVerify';
import MfaEnroll from '../pages/MfaEnroll';
import MfaEnrollVerify from '../pages/MfaEnrollVerify';
import AuthAction from '../pages/AuthAction';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPracticeDetail from '../pages/admin/AdminPracticeDetail';
import PayersPage from '../pages/admin/Payers';
import PayerDetailPage from '../pages/admin/PayerDetail';
import ClearinghousesPage from '../pages/admin/Clearinghouses';
import PracticeDashboard from '../pages/practice/Dashboard';
import PatientsPage from '../pages/practice/Patients';
import PatientDetailPage from '../pages/practice/PatientDetail';
import AppointmentsPage from '../pages/practice/Appointments';
import ProfilePage from '../pages/account/Profile';
import SettingsPage from '../pages/account/Settings';
import UserManagementPage from '../pages/account/UserManagement';
import NotFound from '../pages/NotFound';
import GuestRoute from './GuestRoute';
import EnrollRoute from './EnrollRoute';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import PracticeRoute from './PracticeRoute';

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

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin/practice/:id" element={<AdminPracticeDetail />} />
          <Route path="/admin/payer" element={<PayersPage />} />
          <Route path="/admin/payer/:id" element={<PayerDetailPage />} />
          <Route path="/admin/clearinghouse" element={<ClearinghousesPage />} />
        </Route>

        <Route path="/p/:pid" element={<PracticeRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PracticeDashboard />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:patientId" element={<PatientDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="account/profile" element={<ProfilePage />} />
          <Route path="account/users" element={<UserManagementPage />} />
          <Route path="account/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
