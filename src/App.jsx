import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './features/auth/useAuth';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminShell } from './components/layout/AdminShell';
import { PublicShell } from './components/layout/PublicShell';
import { AuthShell } from './components/layout/AuthShell';
import { LoadingSpinner } from './components/LoadingSpinner';

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const MfaCodePage = lazy(() => import('./pages/auth/MfaCodePage').then((m) => ({ default: m.MfaCodePage })));
const EnrollPhonePage = lazy(() => import('./pages/auth/EnrollPhonePage').then((m) => ({ default: m.EnrollPhonePage })));
const EnrollVerifyPage = lazy(() => import('./pages/auth/EnrollVerifyPage').then((m) => ({ default: m.EnrollVerifyPage })));
const SetPasswordPage = lazy(() => import('./pages/auth/SetPasswordPage').then((m) => ({ default: m.SetPasswordPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AccessDeniedPage = lazy(() => import('./pages/auth/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage })));

// Practice
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PatientsListPage = lazy(() => import('./pages/patients/PatientsListPage').then((m) => ({ default: m.PatientsListPage })));
const PatientDetailPage = lazy(() => import('./pages/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })));
const PatientNewPage = lazy(() => import('./pages/patients/PatientNewPage').then((m) => ({ default: m.PatientNewPage })));
const PatientEditPage = lazy(() => import('./pages/patients/PatientEditPage').then((m) => ({ default: m.PatientEditPage })));
const PatientImportPage = lazy(() => import('./pages/patients/PatientImportPage').then((m) => ({ default: m.PatientImportPage })));
const PatientImportsListPage = lazy(() => import('./pages/patients/PatientImportsListPage').then((m) => ({ default: m.PatientImportsListPage })));
const IntakeSubmissionsPage = lazy(() => import('./pages/patients/IntakeSubmissionsPage').then((m) => ({ default: m.IntakeSubmissionsPage })));
const IntakeSubmissionReviewPage = lazy(() => import('./pages/patients/IntakeSubmissionReviewPage').then((m) => ({ default: m.IntakeSubmissionReviewPage })));

const InsurancePlansListPage = lazy(() => import('./pages/insurance/InsurancePlansListPage').then((m) => ({ default: m.InsurancePlansListPage })));
const InsurancePlanEditPage = lazy(() => import('./pages/insurance/InsurancePlanEditPage').then((m) => ({ default: m.InsurancePlanEditPage })));
const ProvidersListPage = lazy(() => import('./pages/providers/ProvidersListPage').then((m) => ({ default: m.ProvidersListPage })));
const ProviderEditPage = lazy(() => import('./pages/providers/ProviderEditPage').then((m) => ({ default: m.ProviderEditPage })));

const PreProcedureNewPage = lazy(() => import('./pages/pre_procedure/PreProcedureNewPage').then((m) => ({ default: m.PreProcedureNewPage })));
const PreProcedureResultPage = lazy(() => import('./pages/pre_procedure/PreProcedureResultPage').then((m) => ({ default: m.PreProcedureResultPage })));
const PreProcedureHistoryPage = lazy(() => import('./pages/pre_procedure/PreProcedureHistoryPage').then((m) => ({ default: m.PreProcedureHistoryPage })));

const ClaimsWorklistPage = lazy(() => import('./pages/claims/ClaimsWorklistPage').then((m) => ({ default: m.ClaimsWorklistPage })));
const ClaimNewPage = lazy(() => import('./pages/claims/ClaimNewPage').then((m) => ({ default: m.ClaimNewPage })));
const ClaimDetailPage = lazy(() => import('./pages/claims/ClaimDetailPage').then((m) => ({ default: m.ClaimDetailPage })));
const ClaimEditPage = lazy(() => import('./pages/claims/ClaimEditPage').then((m) => ({ default: m.ClaimEditPage })));
const ClaimValidationPage = lazy(() => import('./pages/claims/ClaimValidationPage').then((m) => ({ default: m.ClaimValidationPage })));
const ClaimSubmitPage = lazy(() => import('./pages/claims/ClaimSubmitPage').then((m) => ({ default: m.ClaimSubmitPage })));

const EligibilityCheckPage = lazy(() => import('./pages/eligibility/EligibilityCheckPage').then((m) => ({ default: m.EligibilityCheckPage })));
const EligibilityHistoryPage = lazy(() => import('./pages/eligibility/EligibilityHistoryPage').then((m) => ({ default: m.EligibilityHistoryPage })));

const EraReceiptsListPage = lazy(() => import('./pages/era/EraReceiptsListPage').then((m) => ({ default: m.EraReceiptsListPage })));
const EraReceiptDetailPage = lazy(() => import('./pages/era/EraReceiptDetailPage').then((m) => ({ default: m.EraReceiptDetailPage })));

const AppealsListPage = lazy(() => import('./pages/appeals/AppealsListPage').then((m) => ({ default: m.AppealsListPage })));
const AppealEditorPage = lazy(() => import('./pages/appeals/AppealEditorPage').then((m) => ({ default: m.AppealEditorPage })));

const ProfilePage = lazy(() => import('./pages/account/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SecurityPage = lazy(() => import('./pages/account/SecurityPage').then((m) => ({ default: m.SecurityPage })));

// Admin
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const PracticesListPage = lazy(() => import('./pages/admin/PracticesListPage').then((m) => ({ default: m.PracticesListPage })));
const PracticeOnboardPage = lazy(() => import('./pages/admin/PracticeOnboardPage').then((m) => ({ default: m.PracticeOnboardPage })));
const PracticeDetailPage = lazy(() => import('./pages/admin/PracticeDetailPage').then((m) => ({ default: m.PracticeDetailPage })));
const UsersListPage = lazy(() => import('./pages/admin/UsersListPage').then((m) => ({ default: m.UsersListPage })));
const UserInvitePage = lazy(() => import('./pages/admin/UserInvitePage').then((m) => ({ default: m.UserInvitePage })));
const UserDetailPage = lazy(() => import('./pages/admin/UserDetailPage').then((m) => ({ default: m.UserDetailPage })));
const SystemConfigPage = lazy(() => import('./pages/admin/SystemConfigPage').then((m) => ({ default: m.SystemConfigPage })));
const IntegrationsPage = lazy(() => import('./pages/admin/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const SystemHealthPage = lazy(() => import('./pages/admin/SystemHealthPage').then((m) => ({ default: m.SystemHealthPage })));

// Public
const ScanCapturePage = lazy(() => import('./pages/scan/ScanCapturePage').then((m) => ({ default: m.ScanCapturePage })));
const ScanExpiredPage = lazy(() => import('./pages/scan/ScanExpiredPage').then((m) => ({ default: m.ScanExpiredPage })));
const ScanCompletePage = lazy(() => import('./pages/scan/ScanCompletePage').then((m) => ({ default: m.ScanCompletePage })));
const IntakeFormPage = lazy(() => import('./pages/intake/IntakeFormPage').then((m) => ({ default: m.IntakeFormPage })));
const IntakeFormSubmittedPage = lazy(() => import('./pages/intake/IntakeFormSubmittedPage').then((m) => ({ default: m.IntakeFormSubmittedPage })));
const IntakeNotFoundPage = lazy(() => import('./pages/intake/IntakeNotFoundPage').then((m) => ({ default: m.IntakeNotFoundPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function RootRedirect() {
  const { user, profile, is_admin, mfa_enrolled, is_loading } = useAuth();
  const location = useLocation();
  if (is_loading) return <LoadingSpinner label="Loading…" />;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location }} />;
  if (!mfa_enrolled) return <Navigate to="/auth/enroll-phone" replace />;
  if (is_admin) return <Navigate to="/admin/dashboard" replace />;
  if (profile?.practice_id) return <Navigate to={`/p/${profile.practice_id}/dashboard`} replace />;
  return <Navigate to="/auth/access-denied" replace />;
}

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading…" />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route element={<AuthShell />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/mfa-code" element={<MfaCodePage />} />
          <Route path="/auth/enroll-phone" element={<EnrollPhonePage />} />
          <Route path="/auth/enroll-verify" element={<EnrollVerifyPage />} />
          <Route path="/auth/set-password" element={<SetPasswordPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/access-denied" element={<AccessDeniedPage />} />
        </Route>

        {/* Public */}
        <Route element={<PublicShell />}>
          <Route path="/scan/:token" element={<ScanCapturePage />} />
          <Route path="/scan/:token/expired" element={<ScanExpiredPage />} />
          <Route path="/scan/:token/complete" element={<ScanCompletePage />} />
          <Route path="/intake/:intake_token" element={<IntakeFormPage />} />
          <Route path="/intake/:intake_token/submitted" element={<IntakeFormSubmittedPage />} />
          <Route path="/intake/not-found" element={<IntakeNotFoundPage />} />
        </Route>

        {/* Practice */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/p/:pid" element={<Navigate to="dashboard" replace />} />
          <Route path="/p/:pid/dashboard" element={<DashboardPage />} />

          <Route path="/p/:pid/patients" element={<PatientsListPage />} />
          <Route path="/p/:pid/patients/new" element={<PatientNewPage />} />
          <Route path="/p/:pid/patients/import" element={<PatientImportPage />} />
          <Route path="/p/:pid/patients/imports" element={<PatientImportsListPage />} />
          <Route path="/p/:pid/patients/:patient_id" element={<PatientDetailPage />} />
          <Route path="/p/:pid/patients/:patient_id/edit" element={<PatientEditPage />} />
          <Route path="/p/:pid/patients/:patient_id/pre-procedures" element={<PreProcedureHistoryPage />} />

          <Route path="/p/:pid/intake-submissions" element={<IntakeSubmissionsPage />} />
          <Route path="/p/:pid/intake-submissions/:id" element={<IntakeSubmissionReviewPage />} />

          <Route path="/p/:pid/insurance-plans" element={<InsurancePlansListPage />} />
          <Route path="/p/:pid/insurance-plans/new" element={<InsurancePlanEditPage />} />
          <Route path="/p/:pid/insurance-plans/:id/edit" element={<InsurancePlanEditPage />} />

          <Route path="/p/:pid/providers" element={<ProvidersListPage />} />
          <Route path="/p/:pid/providers/new" element={<ProviderEditPage />} />
          <Route path="/p/:pid/providers/:id/edit" element={<ProviderEditPage />} />

          <Route path="/p/:pid/pre-procedure/new" element={<PreProcedureNewPage />} />
          <Route path="/p/:pid/pre-procedure/:id" element={<PreProcedureResultPage />} />

          <Route path="/p/:pid/claims" element={<ClaimsWorklistPage />} />
          <Route path="/p/:pid/claims/new" element={<ClaimNewPage />} />
          <Route path="/p/:pid/claims/:claim_id" element={<ClaimDetailPage />} />
          <Route path="/p/:pid/claims/:claim_id/edit" element={<ClaimEditPage />} />
          <Route path="/p/:pid/claims/:claim_id/validate" element={<ClaimValidationPage />} />
          <Route path="/p/:pid/claims/:claim_id/submit" element={<ClaimSubmitPage />} />

          <Route path="/p/:pid/eligibility/check" element={<EligibilityCheckPage />} />
          <Route path="/p/:pid/eligibility/history" element={<EligibilityHistoryPage />} />

          <Route path="/p/:pid/era-receipts" element={<EraReceiptsListPage />} />
          <Route path="/p/:pid/era-receipts/:id" element={<EraReceiptDetailPage />} />

          <Route path="/p/:pid/appeals" element={<AppealsListPage />} />
          <Route path="/p/:pid/appeals/:id" element={<AppealEditorPage />} />

          <Route path="/p/:pid/account/profile" element={<ProfilePage />} />
          <Route path="/p/:pid/account/security" element={<SecurityPage />} />
        </Route>

        {/* Admin */}
        <Route
          element={
            <ProtectedRoute admin_only>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/practices" element={<PracticesListPage />} />
          <Route path="/admin/practices/new" element={<PracticeOnboardPage />} />
          <Route path="/admin/practices/:pid" element={<PracticeDetailPage />} />
          <Route path="/admin/users" element={<UsersListPage />} />
          <Route path="/admin/users/new" element={<UserInvitePage />} />
          <Route path="/admin/users/:user_id" element={<UserDetailPage />} />
          <Route path="/admin/system-config" element={<SystemConfigPage />} />
          <Route path="/admin/integrations" element={<IntegrationsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/health" element={<SystemHealthPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
