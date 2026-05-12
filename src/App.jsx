import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './features/auth/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

// Auth
import LoginPage from './pages/auth/LoginPage.jsx';
import EnrollPhonePage from './pages/auth/EnrollPhonePage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';

// Public (no login)
import ScanPage from './pages/scan/ScanPage.jsx';
import IntakePage from './pages/intake/IntakePage.jsx';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage.jsx';

// Patients
import PatientListPage from './pages/patients/PatientListPage.jsx';
import PatientDetailPage from './pages/patients/PatientDetailPage.jsx';
import PatientEntryPage from './pages/patients/PatientEntryPage.jsx';
import InsuranceEntryPage from './pages/patients/InsuranceEntryPage.jsx';
import ImportPage from './pages/patients/ImportPage.jsx';
import IntakeSubmissionsPage from './pages/patients/IntakeSubmissionsPage.jsx';

// Pre-procedure
import PreProcedureListPage from './pages/pre_procedure/PreProcedureListPage.jsx';
import PreProcedureDetailPage from './pages/pre_procedure/PreProcedureDetailPage.jsx';

// Claims
import ClaimsWorklistPage from './pages/claims/ClaimsWorklistPage.jsx';
import ClaimDetailPage from './pages/claims/ClaimDetailPage.jsx';
import ClaimCreatePage from './pages/claims/ClaimCreatePage.jsx';
import AppealPage from './pages/claims/AppealPage.jsx';

// Providers
import ProviderListPage from './pages/providers/ProviderListPage.jsx';

// Admin
import PracticesPage from './pages/admin/PracticesPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import IntegrationsPage from './pages/admin/IntegrationsPage.jsx';
import SystemConfigPage from './pages/admin/SystemConfigPage.jsx';
import AuditLogsPage from './pages/admin/AuditLogsPage.jsx';

export default function App() {
  return (
    <>
      <Routes>
        {/* Auth (no shell) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/enroll-phone" element={<EnrollPhonePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public — no auth, no shell */}
        <Route path="/scan/:token" element={<ScanPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/intake/:token" element={<IntakePage />} />

        {/* Authenticated app */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route path="patients" element={<PatientListPage />} />
          <Route path="patients/new" element={<PatientEntryPage />} />
          <Route path="patients/import" element={<ImportPage />} />
          <Route path="patients/intake-submissions" element={<IntakeSubmissionsPage />} />
          <Route path="patients/:patient_id" element={<PatientDetailPage />} />
          <Route path="patients/:patient_id/insurance" element={<InsuranceEntryPage />} />

          <Route path="pre-procedure" element={<PreProcedureListPage />} />
          <Route path="pre-procedure/:pre_procedure_id" element={<PreProcedureDetailPage />} />

          <Route path="claims" element={<ClaimsWorklistPage />} />
          <Route path="claims/new" element={<ClaimCreatePage />} />
          <Route path="claims/:claim_id" element={<ClaimDetailPage />} />
          <Route path="claims/:claim_id/appeal" element={<AppealPage />} />

          <Route path="providers" element={<ProviderListPage />} />

          <Route path="admin/practices" element={<PracticesPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/integrations" element={<IntegrationsPage />} />
          <Route path="admin/system-config" element={<SystemConfigPage />} />
          <Route path="admin/audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
