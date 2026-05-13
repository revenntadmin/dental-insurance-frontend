# ClearClaim Frontend — README

> **For the AI coding agent:** This is your single source of truth for the `clearclaim-frontend` React application. Read it end-to-end before writing any code. Every page, every route, every API call is specified here. The companion backend README documents the API contract — when in doubt, that document wins for backend behavior, but **this** document wins for frontend behavior. Do not improvise architectural decisions; surface conflicts to the human operator instead.

---

## 1. What This App Is

The ClearClaim frontend is the React UI that dental practice staff use every day. It sits on top of `clearclaim-api` (the Express backend) and talks to it exclusively over HTTPS — no shared code, no monorepo, no proxy other than what Vite provides in dev.

There are three audiences for this UI:

1. **Billing coordinators** — the primary daily users. They live in the claims worklist, draft appeals, run pre-procedure checks, and add patients. The interface for them must be fast, dense with information, and forgiving (no destructive actions without confirm).
2. **Practice owners / office managers** — they look at dashboards and KPIs, manage user accounts and the patient intake QR code, but rarely touch individual claims.
3. **ClearClaim admins (internal staff)** — they live in a separate, visually distinct admin portal where they onboard practices, manage users across tenants, edit system config, and view audit logs.

Two additional surfaces are part of this same React app but render at public, token-authenticated URLs with **no login required**:

- **QR camera scan page** (`/scan/:token`) — a phone opens this after the front desk generates a QR. The page is PWA-installable so it can be saved to a kiosk tablet's homescreen.
- **Patient self-service intake page** (`/intake/:intake_token`) — patients open this in the waiting room from a permanent QR code and fill out their own demographics and insurance.

The same React build serves all of these. Different routes; same app shell, conditional layouts.

---

## 2. Tech Stack

| Layer | Choice |
| ----- | ------ |
| Framework | React 18 (JavaScript, **not** TypeScript) |
| Build tool | Vite |
| Routing | React Router v6 |
| State / server cache | TanStack Query (React Query) v5 for all API data; React Context for auth/session |
| Forms | React Hook Form with Zod schema validation |
| HTTP | Axios — single instance in `src/lib/api_client.js` |
| Auth | Firebase JS SDK (Google Cloud Identity Platform), SMS MFA |
| Styling | TailwindCSS + shadcn/ui primitives |
| Tables | TanStack Table v8 |
| Date utilities | date-fns |
| QR rendering | `qrcode.react` |
| Mobile camera capture | Native `<input type="file" accept="image/*" capture="environment">` |
| PWA | `vite-plugin-pwa` (manifest + service worker; install prompt only on `/scan/...` and `/intake/...`) |
| Charts | Recharts |
| Toast notifications | `sonner` |

**No Redux. No Zustand. No CSS modules.** TanStack Query handles all server cache; React Context handles auth/practice/role; everything else is local component state.

---

## 3. Repository Layout

```
clearclaim-frontend/
  public/
    manifest.json              PWA manifest — enables homescreen install for /scan and /intake
    favicon.svg
  src/
    main.jsx                   App entry; mounts <Router/> with QueryClient + AuthProvider
    App.jsx                    Route tree; layout switching
    routes.jsx                 Centralized route table — all paths and their components

    components/                Cross-cutting UI primitives
      ui/                      shadcn/ui — button, input, dialog, dropdown, sheet, toast, etc.
      layout/
        AppShell.jsx           Practice-side layout: sidebar + header + main
        AdminShell.jsx         Admin portal layout: dark sidebar + red/amber accent
        PublicShell.jsx        Minimal centered layout for /scan and /intake
        AuthShell.jsx          Centered card layout for /auth/* routes
      ConfidenceField.jsx      Form input with green/yellow/red confidence indicator
      StatusBadge.jsx          Status pill for claim_status, appeal_status, etc.
      EmptyState.jsx
      LoadingSpinner.jsx
      ErrorBoundary.jsx
      QRCodeDisplay.jsx        Wraps qrcode.react with print/download buttons

    pages/
      auth/
        LoginPage.jsx                  Email + password (Step 1)
        MfaCodePage.jsx                SMS OTP entry (Step 2 — existing user)
        EnrollPhonePage.jsx            First-time MFA phone enrollment (Step 3 — new user)
        EnrollVerifyPage.jsx           SMS OTP entry for enrollment
        SetPasswordPage.jsx            Landing after welcome email link
        ForgotPasswordPage.jsx
        ResetPasswordPage.jsx
        AccessDeniedPage.jsx
      admin/
        AdminDashboardPage.jsx         Health, recent activity
        PracticesListPage.jsx
        PracticeDetailPage.jsx         Inc. config overrides + intake_token regen
        PracticeOnboardPage.jsx
        UsersListPage.jsx              All users across tenants
        UserDetailPage.jsx
        UserInvitePage.jsx
        SystemConfigPage.jsx
        IntegrationsPage.jsx           AI model, clearinghouse, GCS, SMTP test
        AuditLogsPage.jsx
        SystemHealthPage.jsx
      dashboard/
        DashboardPage.jsx              KPI cards + alerts + recent claims
      patients/
        PatientsListPage.jsx
        PatientDetailPage.jsx
        PatientNewPage.jsx             Manual / upload / QR scan modes
        PatientEditPage.jsx
        PatientImportPage.jsx          CSV upload, column mapping, preview, confirm
        PatientImportsListPage.jsx     History of past imports
        IntakeSubmissionsPage.jsx      Front-desk review queue
        IntakeSubmissionReviewPage.jsx
      insurance/
        InsurancePlansListPage.jsx     Payer master per practice
        InsurancePlanEditPage.jsx
      providers/
        ProvidersListPage.jsx
        ProviderEditPage.jsx
      pre_procedure/
        PreProcedureNewPage.jsx        Pick patient/insurance/procedures, run check
        PreProcedureResultPage.jsx     Coverage + doc checklist
        PreProcedureHistoryPage.jsx    Per-patient history
      claims/
        ClaimsWorklistPage.jsx         Action-required first, then by date desc
        ClaimNewPage.jsx               Create draft (link pre_procedure)
        ClaimDetailPage.jsx            Tabs: Procedures | Validation | Status | ERA
        ClaimEditPage.jsx
        ClaimValidationPage.jsx        Three-layer results UI
        ClaimSubmitPage.jsx            Submit confirmation modal/page
      eligibility/
        EligibilityCheckPage.jsx
        EligibilityHistoryPage.jsx
      era/
        EraReceiptsListPage.jsx
        EraReceiptDetailPage.jsx
      appeals/
        AppealsListPage.jsx
        AppealEditorPage.jsx           AI draft + edit + send + outcome
      account/
        ProfilePage.jsx
        SecurityPage.jsx               Reset MFA, change password
      scan/
        ScanCapturePage.jsx            PUBLIC — /scan/:token — phone camera capture
        ScanExpiredPage.jsx
        ScanCompletePage.jsx           "You can close this tab"
      intake/
        IntakeFormPage.jsx             PUBLIC — /intake/:intake_token — patient form
        IntakeFormSubmittedPage.jsx
        IntakeNotFoundPage.jsx         For 410 Gone
      NotFoundPage.jsx

    features/
      auth/
        AuthContext.jsx                Provides { user, role, practice_id, id_token, ... }
        AuthProvider.jsx               Wraps Firebase onAuthStateChanged
        useAuth.js
        useRequireAuth.js              Hook for route guards
        useRequireAdmin.js
        useRequireMfa.js
      claims/
        useClaim.js
        useClaimsWorklist.js
        useValidateClaim.js
        useSubmitClaim.js
      patients/
        usePatients.js
        usePatient.js
        useExtractDocument.js
        useScanSession.js              Manages QR session creation + polling
        useCsvImport.js
      pre_procedure/
        usePreProcedure.js
      era/
        useEraReceipts.js
      appeals/
        useAppeal.js
        useGenerateAppealDraft.js

    hooks/
      useDebounce.js
      useInterval.js
      useToast.js
      useLocalDraft.js                 Persists in-progress form to sessionStorage
      useTenancyParam.js               Reads :pid from URL, asserts matches AuthContext

    lib/
      api_client.js                    Axios instance + interceptors (attach ID token, refresh on 401)
      auth.js                          Firebase helpers — login, mfa, enroll, set-password
      firebase.js                      Firebase app initialization
      query_client.js                  TanStack QueryClient with default options
      confidence.js                    Confidence band classifier (>=0.85 green, etc.)
      formatters.js                    Money, dates, status labels — pure functions
      cdt_helpers.js                   Tooth-number validation, surface validation
      qr.js                            QR URL builder helpers
      env.js                           Reads import.meta.env, asserts required vars

    styles/
      globals.css                      Tailwind base + tokens
      print.css                        Print styles for QR posters and appeal letters

  vite.config.js
  tailwind.config.js
  postcss.config.js
  .env.example
  package.json
  index.html
```

---

## 4. Environment Configuration

The frontend has very few env vars. All are prefixed `VITE_` so Vite exposes them to the client.

```
VITE_API_BASE_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_TENANT_ID=
VITE_APP_PUBLIC_URL=http://localhost:5173    # used when building QR URLs
VITE_SENTRY_DSN=                              # optional, no PHI ever sent
```

`src/lib/env.js` reads `import.meta.env`, asserts the required ones are present, and exports them as a typed-ish object. The rest of the app imports from `lib/env.js`, never from `import.meta.env` directly.

---

## 5. The HTTP Client and Auth Token Flow

There is exactly **one** Axios instance. It lives in `src/lib/api_client.js`. Every API call goes through it. Direct `fetch()` is not allowed in this codebase except for one place: the public scan upload, where a multipart upload bypasses Axios for simpler progress reporting (still permitted to use Axios — agent's choice — but if `fetch` is used, document why inline).

```javascript
// src/lib/api_client.js
import axios from 'axios';
import { get_id_token, logout } from './auth';
import { env } from './env';

export const api = axios.create({ baseURL: env.api_base_url });

api.interceptors.request.use(async (cfg) => {
  // Don't attach token to public routes
  const is_public = cfg.url?.startsWith('/api/scan/') || cfg.url?.startsWith('/api/intake/');
  if (!is_public) {
    const token = await get_id_token();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response } = err;
    if (response?.status === 401 && response?.data?.error === 'mfa_required') {
      // User is enrolled but token lacks 2nd factor — force re-login
      await logout();
      window.location.href = '/auth/login?reason=mfa_required';
    }
    return Promise.reject(err);
  }
);
```

**Backend error shape** is always `{ error: 'error_code', message: '...' }`. The agent must surface `message` to the user when it's safe to show (most cases) and map known `error_code` values to specific UI (see Section 13 — Error Handling).

---

## 6. Authentication Flow — The Complete State Machine

Auth lives entirely in Firebase. The backend verifies the ID token; the frontend obtains it. The agent must not invent custom session management.

### 6.1 Pages and their transitions

```
                  Welcome email (new user)
                            │
                            ▼
                  /auth/set-password  ──►  /auth/login
                            
  /auth/login (email + password)
        │
        ├── success, no MFA enrolled  ──►  /auth/enroll-phone  ──►  /auth/enroll-verify  ──►  /dashboard
        ├── success, MFA required     ──►  /auth/mfa-code      ──►  /dashboard
        └── success, MFA + enrolled, token already has 2FA  ──►  /dashboard

  /auth/forgot-password  ──►  email sent  ──►  link in email  ──►  /auth/reset-password  ──►  /auth/login
```

### 6.2 `src/lib/auth.js` — the Firebase helper module

This is the file the agent must implement exactly per the spec. It exports `login`, `complete_mfa`, `start_phone_enrollment`, `complete_phone_enrollment`, `logout`, `get_id_token`, `apply_action_code`, `confirm_password_reset`, `send_password_reset_email`.

```javascript
// src/lib/auth.js
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, signOut,
  PhoneAuthProvider, PhoneMultiFactorGenerator,
  multiFactor, RecaptchaVerifier, getMultiFactorResolver,
  applyActionCode, confirmPasswordReset, sendPasswordResetEmail,
} from 'firebase/auth';

const firebase_app = initializeApp({
  api_key:     import.meta.env.VITE_FIREBASE_API_KEY,
  auth_domain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  project_id:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
});
export const auth = getAuth(firebase_app);

// Step 1: password — may return mfa_required or enroll_required
export async function login(email, password, recaptcha_el_id) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const factors = multiFactor(cred.user).enrolledFactors;
    if (factors.length === 0) return { status: 'enroll_required', user: cred.user };
    return { status: 'success', user: cred.user };
  } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      const resolver        = getMultiFactorResolver(auth, err);
      const hint            = resolver.hints[0];
      const recaptcha       = new RecaptchaVerifier(auth, recaptcha_el_id, { size: 'invisible' });
      const phone_prov      = new PhoneAuthProvider(auth);
      const verification_id = await phone_prov.verifyPhoneNumber(
        { multiFactorHint: hint, session: resolver.session }, recaptcha
      );
      return {
        status: 'mfa_required', verification_id, resolver,
        phone_last_four: hint.phoneNumber.slice(-4),
      };
    }
    throw err;
  }
}

export async function complete_mfa(verification_id, otp, resolver) {
  const cred      = PhoneAuthProvider.credential(verification_id, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  return (await resolver.resolveSignIn(assertion)).user;
}

export async function start_phone_enrollment(phone_number, recaptcha_el_id) {
  const session    = await multiFactor(auth.currentUser).getSession();
  const recaptcha  = new RecaptchaVerifier(auth, recaptcha_el_id, { size: 'invisible' });
  const phone_prov = new PhoneAuthProvider(auth);
  return phone_prov.verifyPhoneNumber({ phoneNumber: phone_number, session }, recaptcha);
}

export async function complete_phone_enrollment(verification_id, otp) {
  const cred      = PhoneAuthProvider.credential(verification_id, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(auth.currentUser).enroll(assertion, 'Phone');
}

export const logout                   = () => signOut(auth);
export const get_id_token             = () => auth.currentUser?.getIdToken();
export const apply_action_code        = (code)               => applyActionCode(auth, code);
export const confirm_password_reset   = (code, new_password) => confirmPasswordReset(auth, code, new_password);
export const send_password_reset_email = (email)             => sendPasswordResetEmail(auth, email);
```

### 6.3 `AuthContext`

`AuthProvider.jsx` subscribes to `onAuthStateChanged`, fetches `GET /api/me` once a user is signed in, and exposes:

```javascript
{
  user: firebase_user | null,          // raw Firebase user
  profile: { id, email, role, practice_id, first_name, last_name, mfa_enrolled } | null,
  id_token: string | null,
  is_admin: boolean,                   // profile.role === 'clearclaim_admin'
  is_loading: boolean,                 // true while resolving onAuthStateChanged
  refresh_profile: () => Promise<void>
}
```

Route guards (`useRequireAuth`, `useRequireAdmin`) read from this context and redirect to `/auth/login` or `/auth/access-denied` accordingly.

### 6.4 Welcome email landing — the most important new flow

When the admin creates a user, the backend calls `getAuth().generateEmailVerificationLink(email, { url: FRONTEND_URL + '/auth/set-password' })`. The user clicks the link in the welcome email. Firebase redirects them to `/auth/set-password?oobCode=...&mode=verifyEmail`.

`SetPasswordPage.jsx`:

1. Reads `oobCode` from query string.
2. Calls `apply_action_code(oobCode)` to mark email as verified. If it throws `auth/invalid-action-code` or `auth/expired-action-code`, show "Link expired — ask your admin to resend the invite" with a contact email.
3. Shows two password fields with confirmation, strength meter (zxcvbn). Min 12 chars, must include uppercase + lowercase + digit.
4. Calls `confirm_password_reset(oobCode, new_password)`.
5. Redirects to `/auth/login?welcome=true`. The login page shows a "Your account is ready" banner.
6. After successful first login the user lands in `EnrollPhonePage` (because `enroll_required` is returned by `login()`).

---

## 7. Routing Map (Complete)

> All routes are listed in `src/routes.jsx`. Match this exactly. Layout column tells the agent which shell wraps the page.

### 7.1 Public routes (no auth)

| Path | Component | Layout | Notes |
| ---- | --------- | ------ | ----- |
| `/scan/:token` | `ScanCapturePage` | PublicShell | Camera capture. Calls `POST /api/scan/:token/upload`. PWA-installable. |
| `/scan/:token/expired` | `ScanExpiredPage` | PublicShell | Hit when upload returns 410 or 404. |
| `/scan/:token/complete` | `ScanCompletePage` | PublicShell | "Uploaded successfully — you can close this tab." |
| `/intake/:intake_token` | `IntakeFormPage` | PublicShell | Patient self-service form. Calls `GET` / `POST /api/intake/:intake_token`. |
| `/intake/:intake_token/submitted` | `IntakeFormSubmittedPage` | PublicShell | Thank-you screen. |
| `/intake/not-found` | `IntakeNotFoundPage` | PublicShell | Catches 410 Gone for regenerated tokens. |

### 7.2 Auth routes (no auth required to reach, but they manage auth state)

| Path | Component | Notes |
| ---- | --------- | ----- |
| `/auth/login` | `LoginPage` | Email + password. Optional query `welcome=true`, `reason=mfa_required`. |
| `/auth/mfa-code` | `MfaCodePage` | OTP for existing-user login (Step 2). Reads MFA context from session state. |
| `/auth/enroll-phone` | `EnrollPhonePage` | First-time phone entry. |
| `/auth/enroll-verify` | `EnrollVerifyPage` | OTP for enrollment. |
| `/auth/set-password` | `SetPasswordPage` | Welcome-email landing. Reads `oobCode`. |
| `/auth/forgot-password` | `ForgotPasswordPage` | Sends Firebase password-reset email. |
| `/auth/reset-password` | `ResetPasswordPage` | Reset landing (`oobCode`). |
| `/auth/access-denied` | `AccessDeniedPage` | Shown when route guard rejects. |

### 7.3 Practice routes (auth required, tenancy enforced)

All practice routes are nested under `/p/:pid` so the URL itself encodes the tenant. The `useTenancyParam` hook asserts `pid === profile.practice_id` (admins exempt). Mismatch → redirect to dashboard with a toast.

| Path | Component | Description |
| ---- | --------- | ----------- |
| `/p/:pid` | redirect → `/p/:pid/dashboard` | |
| `/p/:pid/dashboard` | `DashboardPage` | KPIs, alerts, recent claims. |
| `/p/:pid/patients` | `PatientsListPage` | Searchable list. |
| `/p/:pid/patients/new` | `PatientNewPage` | Manual / Upload / QR Scan tabs. |
| `/p/:pid/patients/:patient_id` | `PatientDetailPage` | Demographics, insurances, recent claims. |
| `/p/:pid/patients/:patient_id/edit` | `PatientEditPage` | |
| `/p/:pid/patients/import` | `PatientImportPage` | CSV import wizard (4 steps). |
| `/p/:pid/patients/imports` | `PatientImportsListPage` | History from `import_logs`. |
| `/p/:pid/intake-submissions` | `IntakeSubmissionsPage` | Pending review queue. |
| `/p/:pid/intake-submissions/:id` | `IntakeSubmissionReviewPage` | Confirm / discard. |
| `/p/:pid/insurance-plans` | `InsurancePlansListPage` | Payer master per practice. |
| `/p/:pid/insurance-plans/new` | `InsurancePlanEditPage` | |
| `/p/:pid/insurance-plans/:id/edit` | `InsurancePlanEditPage` | |
| `/p/:pid/providers` | `ProvidersListPage` | |
| `/p/:pid/providers/new` | `ProviderEditPage` | |
| `/p/:pid/providers/:id/edit` | `ProviderEditPage` | |
| `/p/:pid/pre-procedure/new` | `PreProcedureNewPage` | Pick patient/insurance/procedures and run check. |
| `/p/:pid/pre-procedure/:id` | `PreProcedureResultPage` | Result with doc checklist. |
| `/p/:pid/patients/:patient_id/pre-procedures` | `PreProcedureHistoryPage` | |
| `/p/:pid/claims` | `ClaimsWorklistPage` | The day-to-day landing screen for coordinators. |
| `/p/:pid/claims/new` | `ClaimNewPage` | Patient → provider → procedures → optional pre_procedure link. |
| `/p/:pid/claims/:claim_id` | `ClaimDetailPage` | Tabs: Procedures, Validation, Status History, ERA. |
| `/p/:pid/claims/:claim_id/edit` | `ClaimEditPage` | Drafts only. |
| `/p/:pid/claims/:claim_id/validate` | `ClaimValidationPage` | Three-layer results UI. |
| `/p/:pid/claims/:claim_id/submit` | `ClaimSubmitPage` | Confirm + submit. |
| `/p/:pid/eligibility/check` | `EligibilityCheckPage` | Standalone check. |
| `/p/:pid/eligibility/history` | `EligibilityHistoryPage` | |
| `/p/:pid/era-receipts` | `EraReceiptsListPage` | |
| `/p/:pid/era-receipts/:id` | `EraReceiptDetailPage` | |
| `/p/:pid/appeals` | `AppealsListPage` | All draft + sent appeals. |
| `/p/:pid/appeals/:id` | `AppealEditorPage` | AI draft editor + send + log outcome. |
| `/p/:pid/account/profile` | `ProfilePage` | First/last name. |
| `/p/:pid/account/security` | `SecurityPage` | Reset MFA, change password. |

### 7.4 Admin routes (auth + admin_only)

| Path | Component | Description |
| ---- | --------- | ----------- |
| `/admin` | redirect → `/admin/dashboard` | |
| `/admin/dashboard` | `AdminDashboardPage` | Health + recent activity. |
| `/admin/practices` | `PracticesListPage` | |
| `/admin/practices/new` | `PracticeOnboardPage` | Wizard. |
| `/admin/practices/:pid` | `PracticeDetailPage` | Inc. config overrides + intake_token. |
| `/admin/users` | `UsersListPage` | Across all tenants. |
| `/admin/users/new` | `UserInvitePage` | Triggers welcome email. |
| `/admin/users/:user_id` | `UserDetailPage` | MFA management. |
| `/admin/system-config` | `SystemConfigPage` | |
| `/admin/integrations` | `IntegrationsPage` | AI model / clearinghouse / SMTP test. |
| `/admin/audit-logs` | `AuditLogsPage` | |
| `/admin/health` | `SystemHealthPage` | |

### 7.5 Catch-all

`*` → `NotFoundPage`.

---

## 8. Page-by-Page Specifications

Each page below lists: what the user sees, what data it fetches, what mutations it sends, and the exact backend routes it talks to. **Every API path here matches the backend README — if you change one, change both.**

### 8.1 Authentication Pages

#### `LoginPage` (`/auth/login`)
- **UI:** Centered card. Email + password fields. "Forgot password?" link. Optional banners: `welcome=true` shows "Your account is ready — sign in to continue." `reason=mfa_required` shows "Please sign in again to verify your phone."
- **Behavior:**
  1. On submit, calls `login(email, password, 'recaptcha-container')` from `lib/auth.js`.
  2. `status === 'success'` → push `/p/:pid/dashboard` (look up `pid` from `/api/me`).
  3. `status === 'enroll_required'` → push `/auth/enroll-phone`.
  4. `status === 'mfa_required'` → store `{ verification_id, resolver, phone_last_four }` in a React Context (`MfaContext`, scoped to the auth flow), push `/auth/mfa-code`.
- **API:** `GET /api/me` after Firebase login resolves.
- **Hidden DOM:** `<div id="recaptcha-container" />` — required by Firebase invisible reCAPTCHA.

#### `MfaCodePage` (`/auth/mfa-code`)
- **UI:** 6-digit code input. Helper text: "Enter the code sent to ***-***-**{phone_last_four}".
- **Behavior:** Calls `complete_mfa(verification_id, otp, resolver)`. On success, push `/p/:pid/dashboard`. Show "Resend code" after 30 s.
- **Guard:** If `MfaContext` is empty (user navigated here directly), push to `/auth/login`.

#### `EnrollPhonePage` (`/auth/enroll-phone`)
- **UI:** Phone-number input (E.164 format, with country selector defaulting to +1). Privacy copy: "We'll send a verification code by SMS. Phone numbers are stored only in Firebase, never in our database."
- **Behavior:** Calls `start_phone_enrollment(phone, 'recaptcha-container')`. Stores `verification_id` in `MfaContext`. Push `/auth/enroll-verify`.

#### `EnrollVerifyPage` (`/auth/enroll-verify`)
- **UI:** 6-digit code input.
- **Behavior:**
  1. Calls `complete_phone_enrollment(verification_id, otp)`.
  2. Then calls `POST /api/me/mfa/confirm-enrollment` (backend updates `users.mfa_enrolled`, `mfa_phone_last_4`, `mfa_enrolled_at`).
  3. Triggers `refresh_profile()` on AuthContext.
  4. Push `/p/:pid/dashboard`.

#### `SetPasswordPage` (`/auth/set-password`)
- **UI:** Password + confirm password fields, strength meter.
- **Behavior:**
  1. Read `oobCode` from query string. On mount call `apply_action_code(oobCode)`.
  2. On submit call `confirm_password_reset(oobCode, password)`.
  3. Redirect to `/auth/login?welcome=true`.
- **Error states:** `auth/invalid-action-code` / `auth/expired-action-code` → show "This link has expired" with admin contact info.

#### `ForgotPasswordPage` / `ResetPasswordPage`
- Standard Firebase password-reset using `send_password_reset_email` / `confirm_password_reset`.

---

### 8.2 Practice Dashboard

#### `DashboardPage` (`/p/:pid/dashboard`)
- **What the user sees:**
  - Header: practice name, today's date.
  - **KPI cards (top row, 4 across)** — total billed (30d), total pending, denials needing action, clean-claim rate.
  - **Action Required panel** — links to claims that need attention.
  - **Recent ERAs** — last 5, click through to detail.
  - **Pending intake submissions** — count badge linking to `/p/:pid/intake-submissions`.
- **API calls (parallel via React Query):**
  - `GET /api/practice/:pid/metrics?period=30d` → KPI cards.
  - `GET /api/practice/:pid/alerts` → Action Required.
  - `GET /api/practice/:pid/era_receipts?limit=5` → Recent ERAs.
  - `GET /api/practice/:pid/intake_submissions?status=pending_review&limit=1` → Just for the count (use `total` from response).

---

### 8.3 Patients

#### `PatientsListPage` (`/p/:pid/patients`)
- **UI:** Searchable table. Columns: Last name, First name, DOB, Insurance (primary payer name), Last visit, Chart #. Row click → patient detail. Top-right button: "New Patient" → `/p/:pid/patients/new`. Secondary button: "Import CSV" → `/p/:pid/patients/import`.
- **API:** `GET /api/practice/:pid/patients?q=<debounced_search>&limit=50&offset=N`.

#### `PatientDetailPage` (`/p/:pid/patients/:patient_id`)
- **UI:** Tabs — Profile, Insurances, Claims, Pre-Procedures, Documents.
- **API:**
  - `GET /api/practice/:pid/patients/:patient_id` → profile + insurances.
  - `GET /api/practice/:pid/claims?patient_id=:patient_id` → Claims tab.
  - `GET /api/practice/:pid/patients/:patient_id/pre_procedures` → Pre-Procedures tab.
  - `GET /api/practice/:pid/documents?patient_id=:patient_id` → Documents tab.

#### `PatientNewPage` (`/p/:pid/patients/new`)
- **UI:** Three tabs — **Manual**, **Upload**, **QR Scan**. All three flows funnel into the same form-confirmation step where extracted fields are pre-filled with confidence indicators.
- **Manual tab:** Plain form; no AI extraction.
- **Upload tab:**
  1. File picker accepts JPG/PNG/PDF.
  2. On select: shows preview, triggers `POST /api/practice/:pid/documents/extract` (multipart, body field `document_type=patient_intake` or `insurance_card`).
  3. On 200, populate form fields from response. Each field gets a `ConfidenceField` wrapper using the `>= 0.85` / `0.60–0.84` / `< 0.60` bands.
- **QR Scan tab:**
  1. On tab open, `POST /api/practice/:pid/scan_sessions` body `{ scan_type: 'patient_info' }`. Returns `{ session_id, token, qr_url }`.
  2. Render QR code from `qr_url` using `qrcode.react`.
  3. If patient has phone on file (when a `patient_id` is provided), show "Or send link to ***-***-{last_4}" with a button that calls `POST /api/practice/:pid/scan_sessions/:session_id/send_sms`.
  4. Start polling `GET /api/practice/:pid/scan_sessions/:session_id` every 2 seconds (use `useInterval`).
  5. Polling states:
     - `pending` → keep QR + spinner visible.
     - `completed` → stop polling, populate form fields from `extracted_result`.
     - `expired` → show "Link expired" + "Generate New QR Code" button.
  6. Cleanup: when leaving the page or completing, cancel polling.
- **Submit (any tab):** `POST /api/practice/:pid/patients` body in snake_case. On success → push `/p/:pid/patients/:patient_id`.

#### `PatientImportPage` (`/p/:pid/patients/import`) — 4-step wizard
- **Step 1 — Upload:**
  - File input (CSV, up to 10MB). On select, `POST /api/practice/:pid/patients/import/upload` multipart.
  - If response is 422 `row_limit_exceeded`, show "Your file has {found} rows but the limit is {limit}. Contact your admin to raise this limit." (no upload retry).
  - On 200: receive `{ upload_id, row_count, raw_headers }`. Persist to component state.
- **Step 2 — Column Mapping:**
  - Render a table: left column = CSV header (read-only), middle = ClearClaim field dropdown, right = confidence badge.
  - Hit `POST /api/practice/:pid/patients/import/:upload_id/suggest_mapping` first to get auto-suggestions. Apply them as defaults — user can override every one.
  - "Skip this column" option in every dropdown.
- **Step 3 — Preview:**
  - On "Continue", call `POST /api/practice/:pid/patients/import/:upload_id/validate` with `{ column_map }`.
  - Render row-by-row table with `ready` / `warning` / `error` badges and per-row messages.
  - Per-row "Skip" checkbox lets the user exclude specific rows.
  - "Back to Column Mapping" button preserves state.
  - "Download Error Report" button — exports the errors as CSV client-side.
- **Step 4 — Confirm:**
  - On "Import Now", call `POST /api/practice/:pid/patients/import/:upload_id/confirm` body `{ skipped_rows: [3, 7, 42] }`.
  - On success show success state with counts: `{ imported, skipped, errors }`. Buttons: "View Patients" → `/p/:pid/patients`, "Run another import" → reset wizard.

#### `IntakeSubmissionsPage` / `IntakeSubmissionReviewPage`
- Lists `pending_review` submissions. Detail page renders the raw form fields in an editable layout. "Confirm" calls `PUT .../confirm` (which writes a patient + patient_insurance and links the submission). "Discard" calls `PUT .../discard`.

---

### 8.4 Insurance Plans

#### `InsurancePlansListPage` (`/p/:pid/insurance-plans`)
- **UI:** Table of payers. Columns: Payer name, Payer ID, Phone, # patients. "New Plan" button.
- **API:** `GET /api/practice/:pid/insurance_plans`.

#### `InsurancePlanEditPage` — `/p/:pid/insurance-plans/new` or `/:id/edit`
- **UI:** Form with payer_name, payer_id (5-digit, validated client-side), payer_address, payer_phone.
- **API:** `POST` or `PUT /api/practice/:pid/insurance_plans[/:id]`.

---

### 8.5 Providers

#### `ProvidersListPage`
- **UI:** Table. Columns: Name, NPI, License #, Specialty, Active. Toggle to filter inactive.
- **API:** `GET /api/practice/:pid/providers`.

#### `ProviderEditPage`
- **UI:** Form. NPI validated as 10 digits client-side (server enforces uniqueness).
- **API:** `POST` / `PUT /api/practice/:pid/providers[/:id]`.

---

### 8.6 Pre-Procedure

#### `PreProcedureNewPage` (`/p/:pid/pre-procedure/new`)
- **UI:**
  - Patient picker (autocomplete from `GET /api/practice/:pid/patients?q=...`).
  - On patient select, populate provider + primary insurance dropdowns from that patient's record.
  - Service date picker.
  - Procedures table — repeatable rows. Each row: CDT code (autocomplete via `GET /api/practice/:pid/cdt_codes?search=...`), tooth #, surfaces, fee. Tooth/surface visibility driven by `cdt_codes.requires_tooth` / `requires_surface`.
  - "Run Check" button.
- **API:** `POST /api/practice/:pid/pre_procedures` body `{ patient_id, provider_id, patient_insurance_id, service_date, procedures: [...] }`. Redirect to `/p/:pid/pre-procedure/:id` on success.

#### `PreProcedureResultPage` (`/p/:pid/pre-procedure/:id`)
- **UI** (mirrors the spec UI exactly):
  - Header: practice + patient + insurance + "Checked at" timestamp.
  - "Re-run" and "Use in Claim" buttons.
  - **Coverage Summary** card: status, coverage %, deductible (annual / met), annual max, fee, est. patient, est. insurance, approval likelihood badge, pre-auth required Y/N, frequency limit text.
  - **Required Documentation** card: checklist. Each item shows "(Required — standard)" or "(Required — {payer_name})" or "(Optional — {payer_name})".
- **API:** `GET /api/practice/:pid/pre_procedures/:id`.
- **"Use in Claim" button:** navigates to `/p/:pid/claims/new?pre_procedure_id=:id` and `ClaimNewPage` pre-fills patient, insurance, procedures.

---

### 8.7 Claims (the core of the app)

#### `ClaimsWorklistPage` (`/p/:pid/claims`)
- **UI:**
  - Top bar: search, filters (status, service date range, provider, payer), "New Claim" button.
  - Default sort: action-required first (denied, validation_failed), then by `service_date` desc.
  - Columns: Patient · Service Date · CDT Codes (badge list) · Billed · Insurance · Pre-Proc? (Y/N icon) · Status (`StatusBadge`) · Actions.
  - Status-conditional Quick Actions:
    - `draft` → **Validate**
    - `validated` → **Submit**
    - `denied` → **Draft Appeal**
    - `paid` → **View ERA**
  - Row click → `/p/:pid/claims/:claim_id`.
- **API:** `GET /api/practice/:pid/claims?status=...&service_date_from=...&...`.

#### `ClaimNewPage` (`/p/:pid/claims/new`)
- **UI:**
  - Step 1 — Patient + provider + service date.
  - Step 2 — Primary insurance (and optional secondary if patient has one). If a recent matching `pre_procedure` exists, render a banner: "Use pre-procedure check from {N} days ago for these procedures?" with [Yes — pre-fill] / [No — start fresh].
  - Step 3 — Procedures (same repeatable row UI as pre-procedure).
  - "Save Draft" button.
- **API:**
  - Optional `GET /api/practice/:pid/patients/:patient_id/pre_procedures` to surface the suggestion banner.
  - `POST /api/practice/:pid/claims` to save.

#### `ClaimDetailPage` (`/p/:pid/claims/:claim_id`)
- **UI:** Header with patient summary + status badge. Action buttons depend on status (mirror worklist quick actions). Tabs:
  1. **Procedures** — line items, fees, paid/adjustment/patient amounts after ERA.
  2. **Validation** — last validation result (link to full `/validate` page).
  3. **Status History** — read-only list from `claim_status_history`.
  4. **ERA** — empty until ERA arrives; then shows paid / patient / denial codes per line.
- **API:**
  - `GET /api/practice/:pid/claims/:claim_id`.
  - `GET /api/practice/:pid/claims/:claim_id/validation_issues`.
  - `GET /api/practice/:pid/claims/:claim_id/status_history`.
  - `GET /api/practice/:pid/era_receipts?claim_id=:claim_id`.

#### `ClaimValidationPage` (`/p/:pid/claims/:claim_id/validate`)
- **UI** (mirrors spec exactly):
  - "Re-validate" button (top right).
  - **Layer 1: Coverage** — pulled from pre-procedure if reused (show "from Pre-Procedure run {N} days ago"), else from fresh Stedi call (show "fresh check, just now"). Lists coverage active, coverage %, deductible, est. patient, approval likelihood, pre-auth required.
  - **Layer 2: Rule-Based Checks** — all green checks listed individually; any errors shown in red.
  - **Layer 3: AI Validation** — issues rendered with severity badge and a one-paragraph explanation. If the AI was unavailable: show an `info` banner.
  - Footer counts: "{X} Errors · {Y} Warnings · {Z} Info".
  - Buttons: **Edit Claim** (push to `/edit`); **Submit (Y Warning — Confirm)** if no errors. Disabled if any errors.
- **API:** `POST /api/practice/:pid/claims/:claim_id/validate`. The response contains `{ issues, passed, coverage }`.

#### `ClaimSubmitPage` (`/p/:pid/claims/:claim_id/submit`)
- **UI:** Confirmation modal/page. Summary, "I confirm this claim is ready" checkbox, **Submit** button. On submit, show spinner. On success → `/p/:pid/claims/:claim_id` with toast "Submitted — control number {control_number}". On rejection → list rejection reasons.
- **API:** `POST /api/practice/:pid/claims/:claim_id/submit`.

---

### 8.8 Eligibility

#### `EligibilityCheckPage`
- **UI:** Patient + insurance picker, claim picker (optional), "Force re-check" toggle. Result panel shows coverage active, plan name, deductibles, OOP, and a timestamp of when the data was fetched (with a reuse banner if data < 7 days old).
- **API:** `POST /api/practice/:pid/eligibility/check`.

#### `EligibilityHistoryPage`
- **UI:** Table of recent checks.
- **API:** `GET /api/practice/:pid/eligibility/checks`.

---

### 8.9 ERA Receipts

#### `EraReceiptsListPage`
- **UI:** Table — Date, Payer, Check #, Total Paid, # claims.
- **API:** `GET /api/practice/:pid/era_receipts`.

#### `EraReceiptDetailPage`
- **UI:** Header (payer, check #, date, total). Table of ERA lines linked to claims. Click line → claim detail.
- **API:** `GET /api/practice/:pid/era_receipts/:id`.

---

### 8.10 Appeals

#### `AppealsListPage`
- **UI:** Table. Status filter chips (`draft`, `sent`, `appeal_accepted`, `appeal_denied`). Columns: Claim #, Patient, Payer, Generated at, Status, Action.
- **API:** `GET /api/practice/:pid/appeals?status=...`.

#### `AppealEditorPage` (`/p/:pid/appeals/:id`)
- **UI:**
  - Left column: claim summary (patient, payer, denial codes, denied procedures).
  - Right column: appeal letter editor (rich-text or large textarea, monospace-friendly). Toolbar buttons: **Regenerate Draft** (re-runs AI), **Mark as Sent**, **Log Outcome** (modal — `appeal_accepted` / `appeal_denied` + notes).
  - Status badges driven by `appeals.status`.
- **API:**
  - `GET /api/practice/:pid/appeals/:id`.
  - `POST /api/practice/:pid/claims/:claim_id/appeals/draft` for regeneration.
  - `PUT /api/practice/:pid/appeals/:id` body `{ final_letter }` on edit autosave.
  - `POST /api/practice/:pid/appeals/:id/mark_sent`.
  - `POST /api/practice/:pid/appeals/:id/log_outcome` body `{ outcome, notes }`.
- **Behavior:** Autosave the `final_letter` every 5 seconds (debounced) while editing. Show a "Saving..." / "Saved" indicator.

---

### 8.11 Account

#### `ProfilePage` — first/last name editing.
- **API:** `PUT /api/me/profile`.

#### `SecurityPage`
- **UI:** "Change password" (Firebase reauth + update), "Reset MFA" (warns user — calls `POST /api/me/mfa/reset`, then forces logout and re-login).

---

### 8.12 Admin Pages (use `AdminShell` — dark sidebar, red/amber accent)

#### `AdminDashboardPage`
- **UI:** Health card cluster: queue depth, DB latency, clearinghouse status (all from `/api/admin/health/...`). Recent activity feed (audit logs, last 50).
- **API:** `GET /api/admin/health/queues`, `/api/admin/health/db`, `/api/admin/health/clearinghouse`, `/api/admin/audit_logs?limit=50`.

#### `PracticesListPage` (admin)
- **UI:** Table — Name, City/State, Status, # users, # claims (30d), Stedi enrolled. "New Practice" button.
- **API:** `GET /api/admin/practices`.

#### `PracticeOnboardPage`
- **UI:** Wizard — Step 1 practice info, Step 2 Stedi enrollment, Step 3 first user (admin or practice_owner), Step 4 review + create.
- **API:** `POST /api/admin/practices`, then `POST /api/admin/users`.

#### `PracticeDetailPage` (admin)
- **UI:** Tabs — Overview, Users, Config Overrides, Integrations, Intake QR.
  - **Config Overrides tab:** table of practice_configs entries. Add / edit / remove buttons. Removing reverts to system_configs default — show the default value next to the override.
  - **Intake QR tab:** displays the current `https://app.clearclaim.io/intake/{intake_token}` URL as a QR code (large, printable). "Print Poster" button. "Regenerate Token" button with confirm modal explaining old QR codes will stop working.
- **API:**
  - `GET /api/admin/practices/:pid`.
  - `GET /api/admin/practices/:pid/configs`.
  - `PUT /api/admin/practices/:pid/configs/:key`.
  - `DELETE /api/admin/practices/:pid/configs/:key`.
  - `POST /api/admin/practices/:pid/regenerate_intake_token`.
  - `POST /api/admin/practices/:pid/suspend` / `/activate`.

#### `UsersListPage` (admin)
- **UI:** Table — Email, Name, Role, Practice, MFA enrolled, Active. Search and filter by practice.
- **API:** `GET /api/admin/users`.

#### `UserInvitePage`
- **UI:** Form — practice picker (omit for admin), email, role, first/last name. "Send Invite" button. Success state: "Welcome email sent to {email}".
- **API:** `POST /api/admin/users`.

#### `UserDetailPage` (admin)
- **UI:** Profile fields, MFA status panel ("Enrolled — ends in {last_4}" / "Not enrolled"), "Reset MFA" button, "Deactivate" button, "Resend Invite" button (visible if user hasn't completed first login).
- **API:**
  - `GET /api/admin/users/:user_id`.
  - `POST /api/admin/users/:user_id/reset_mfa`.
  - `POST /api/admin/users/:user_id/deactivate`.
  - `POST /api/admin/users/:user_id/resend_invite`.

#### `SystemConfigPage`
- **UI:** Table — Key, Current value, Description, Last updated. Inline edit.
- **API:** `GET /api/admin/system_configs`, `PUT /api/admin/system_configs/:key`.

#### `IntegrationsPage`
- **UI:** Sections — AI Model (provider + task models), Clearinghouse, GCS bucket, SMTP. Each section has a "Test Connection" button.
- **API:** Updates go through `PUT /api/admin/system_configs/:key`. Test buttons hit health endpoints.

#### `AuditLogsPage`
- **UI:** Date range + practice + user + action filters; paginated table. PHI-free — only action, resource_type, resource_id, timestamp shown.
- **API:** `GET /api/admin/audit_logs?...`.

#### `SystemHealthPage`
- Detailed views of queue depth, DB stats, recent failed transactions (`tx_status='failed'`).

---

### 8.13 Public Pages

#### `ScanCapturePage` (`/scan/:token`)
- **UI:** Full-screen fullbleed camera capture. "Take Photo" button (uses `<input type="file" capture="environment">`). Preview. "Retake" / "Upload" buttons. Progress bar during upload.
- **Behavior:**
  1. On mount, no API call needed yet — the page just renders camera UI. (Optional: a HEAD probe to validate the token; not required.)
  2. On "Upload", `POST /api/scan/:token/upload` multipart. **No auth token attached** — the URL token authenticates.
  3. On 200 → push `/scan/:token/complete`.
  4. On 404 or 410 → push `/scan/:token/expired`.
  5. On 409 (`already_used`) → push `/scan/:token/expired` with a different message.
- **PWA hook:** show "Add to Home Screen" prompt the second time a user visits.

#### `IntakeFormPage` (`/intake/:intake_token`)
- **UI:** Patient-facing form. Sections — Personal, Address, Phone/Email, Primary insurance, Secondary insurance (optional toggle), Emergency contact (optional). Clean mobile-first layout.
- **Behavior:**
  1. On mount, `GET /api/intake/:intake_token` → returns `{ practice_name, practice_logo_url?, form_schema }`. If 410, push `/intake/not-found`.
  2. On submit, `POST /api/intake/:intake_token` with all fields. **No auth token attached.**
  3. On 200 → push `/intake/:intake_token/submitted`.

---

## 9. Components — Reusable Building Blocks

### 9.1 `ConfidenceField`
A wrapper around any form input. Props: `value`, `confidence`, `onChange`, plus the underlying input props. Renders the value pre-filled with a colored left border:

- `>= 0.85` → green border, no badge.
- `0.60 – 0.84` → yellow border, badge: "Review this field".
- `< 0.60` or `null` → red border, badge: "Please enter manually". Field is empty.

This component is used in PatientNewPage (Upload + QR tabs) and IntakeSubmissionReviewPage.

### 9.2 `StatusBadge`
Renders any of `claim_status`, `appeal_status`, `practice_status`, `pre_procedure_status`, `clearinghouse_tx_status` as a colored pill with a human-readable label. Color map lives in `lib/formatters.js`.

### 9.3 `QRCodeDisplay`
Wraps `qrcode.react`. Props: `url`, `size`, `caption?`. Renders the QR code plus a "Print" button (opens a print-friendly window) and a "Download SVG" button.

### 9.4 `ProcedureRow`
Editable repeatable row used in pre-procedure and claim creation. Wires CDT autocomplete, drives tooth-number and surface visibility from `cdt_codes.requires_tooth/requires_surface`. Lives in `components/`.

### 9.5 Layouts
- `AppShell` — practice sidebar with sections: Dashboard, Claims, Pre-Procedure, Patients, Eligibility, ERAs, Appeals, Insurance Plans, Providers; account menu in header (with practice name).
- `AdminShell` — distinct dark-mode sidebar (red/amber accent — explicitly different from practice shell to prevent context confusion).
- `PublicShell` — minimal, no nav. Includes a tiny ClearClaim footer with a "Why am I seeing this?" link to a public help page.
- `AuthShell` — centered card on a soft gradient background.

---

## 10. Data Fetching Conventions

### 10.1 Query keys
Use a consistent structure for cache invalidation:

```
['practice', pid, 'claims', { status: 'draft' }]
['practice', pid, 'claims', claim_id]
['practice', pid, 'claims', claim_id, 'validation']
['practice', pid, 'patients', { q: 'smith' }]
['admin', 'practices']
['me']
```

### 10.2 Mutation pattern
Every mutation hook uses `useMutation` and on success invalidates the queries it affects. Example:

```javascript
export function useValidateClaim(pid, claim_id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/practice/${pid}/claims/${claim_id}/validate`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims', claim_id] });
      qc.invalidateQueries({ queryKey: ['practice', pid, 'claims', claim_id, 'validation'] });
    },
  });
}
```

### 10.3 Polling
Two places poll:
- **`useScanSession`** — polls `GET .../scan_sessions/:id` every 2 s while `status === 'pending'`, stops on `completed`, `expired`, or unmount.
- **`useClaimStatusPolling`** — optional, claim detail page may poll status every 30 s for visibility (the backend already polls via Cloud Tasks, this is just UX).

Use `refetchInterval` on the React Query hook for both.

### 10.4 Optimistic updates
Use sparingly. Permitted for: marking a validation issue resolved, toggling row skips in CSV import preview. Not permitted for any mutation that hits a clearinghouse or a payer — those must wait for the real response.

---

## 11. Forms

All forms use **React Hook Form + Zod**. The agent should:

- Define a Zod schema per form in the same file as the page component (or in a sibling `*.schema.js` if reused).
- Submit via `handleSubmit(onSubmit)` where `onSubmit` calls a mutation hook.
- Surface server-side validation errors (returned as `{ error: 'validation_failed', message: '...', field_errors: { field: 'message' } }`) by calling `setError` for each field.
- For multi-step forms (CSV import, claim new), use `useLocalDraft` to persist progress to sessionStorage so a refresh doesn't lose work.

---

## 12. Tenancy — How `:pid` is Validated

The URL `/p/:pid/...` always includes the practice ID. On every practice route:

1. `useTenancyParam()` reads `pid` from `useParams()`.
2. Compares against `profile.practice_id` from `AuthContext`.
3. If mismatch and user is not admin → redirect to `/p/${profile.practice_id}/dashboard` with a toast "You don't have access to that practice."
4. If user is admin, allow the override (admins legitimately switch tenants).

The backend separately enforces tenancy on every request. The frontend check is purely UX — never rely on it for security.

---

## 13. Error Handling

### 13.1 Standard handling
- 4xx with `{ error, message }` → toast the `message`, do not redirect.
- 500 → toast "Something went wrong. Please try again." plus a "Retry" button on data-fetch hooks.
- Network failure (no response) → toast "We can't reach the server. Check your connection."

### 13.2 Special error codes
| `error_code` | Behavior |
| ------------ | -------- |
| `missing_token` | Force re-login (push `/auth/login`). |
| `invalid_token` | Force re-login. |
| `mfa_required` | Force re-login with reason. Already handled in api_client interceptor. |
| `user_not_found` | Sign user out + push `/auth/access-denied`. |
| `row_limit_exceeded` | (CSV) Show specific limit-exceeded screen. |
| `link_expired` | (Scan / Intake) Push to the page's expired variant. |
| `not_found` | (Scan / Intake) Push to expired variant. |
| `already_used` | (Scan) Push to expired variant with different copy. |

### 13.3 ErrorBoundary
Wrap every layout at the top level with `ErrorBoundary`. On caught error: render a fallback page with "Reload" + "Report a problem" (mailto). **No PHI in the error report.** Send Sentry only `error.message`, `error.stack`, and `route` — never the request body or response body.

---

## 14. Confidence Display Rules (Document Extraction)

When rendering a `ConfidenceField`, classify per `lib/confidence.js`:

```javascript
export function band(conf) {
  if (conf == null || conf < 0.60) return 'red';     // empty, manual entry required
  if (conf < 0.85)                  return 'yellow'; // pre-fill, highlight for review
  return 'green';                                    // pre-fill silently
}
```

This applies identically in both Upload and QR Scan modes.

---

## 15. Print Styles

Two pages need print support:
- **AppealEditorPage** — print just the `final_letter` content on letterhead. Hide editor toolbar, sidebar, header.
- **PracticeDetailPage → Intake QR tab** — print the QR code at poster size with practice name + a brief "Scan this code to fill out your new-patient forms" caption.

Use a `print.css` file with `@media print` rules, plus `display: none` classes on non-print elements.

---

## 16. PWA Configuration

`vite-plugin-pwa` is configured to:
- Generate a service worker that **only** caches static assets (JS/CSS/fonts). **No API responses.** PHI must never be cached on the client.
- Show "Add to Home Screen" prompt only on `/scan/...` and `/intake/...` routes. Suppress it everywhere else.
- Manifest sets app name "ClearClaim Scan" with the brand icon.

---

## 17. Accessibility

- All interactive elements keyboard-reachable.
- Focus rings preserved — never `outline: none`.
- Form fields have explicit `<label htmlFor>`.
- Status colors backed by icons + text (don't rely on color alone).
- Live regions (`aria-live="polite"`) on toast notifications and on the scan-session polling status.
- Minimum contrast ratio AA (4.5:1 for body text). Tailwind palette tokens chosen accordingly.

---

## 18. Local Development

```bash
# 1. Install
npm install

# 2. Run the backend (separately, see clearclaim-api README)
# 3. Run the frontend
npm run dev

# Vite dev server: http://localhost:5173
# Backend expected at:  http://localhost:3001 (VITE_API_BASE_URL)
```

To test the welcome-email flow locally:
- Make sure Mailhog is running (per backend README).
- Create a user via Admin Portal → Users → New User.
- Open `http://localhost:8025` to find the welcome email.
- Click the link — Firebase will redirect to `http://localhost:5173/auth/set-password?oobCode=...`.

To test QR scan flow locally:
- Generate a scan session on the desktop browser at `http://localhost:5173/p/:pid/patients/new` (QR Scan tab).
- The QR will encode a URL like `http://localhost:5173/scan/{token}` — your phone won't resolve that. Use a tunneling tool (ngrok, Cloudflare Tunnel) to expose `localhost:5173` to your phone, and set `VITE_APP_PUBLIC_URL` to the tunnel URL.

---

## 19. Rules the Agent Must Follow

1. **Match the backend route map exactly.** Every API path used in the frontend must exist in the backend README. If a route is needed that doesn't exist there, **stop** and flag it.
2. **snake_case in all API request and response bodies.** UI form-field names also in snake_case so they map 1:1 with API fields.
3. **No `fetch()` direct calls** except where explicitly noted. Always go through `lib/api_client.js`.
4. **No `localStorage` for PHI.** Use `sessionStorage` for in-progress form drafts only, keyed by a UUID, and wipe on submit or logout.
5. **No analytics or third-party trackers** without explicit human approval. PHI exposure risk.
6. **No Sentry breadcrumbs that include API request or response bodies.** Sanitize aggressively.
7. **No URL params with PHI.** Patient names, member IDs, denial details — never in the query string. Use POST bodies or path UUIDs.
8. **No hardcoded API base URL.** Always read from `lib/env.js`.
9. **Tenancy is enforced both client-side and server-side.** The client-side check is UX only; never assume the server didn't also check.
10. **Public routes (`/scan/...`, `/intake/...`) do not attach the auth token.** The api_client interceptor already excludes these paths — agent must not bypass that.
11. **No model names hardcoded in the frontend.** The frontend never mentions Claude, Gemini, OpenAI by name — it just calls backend endpoints that internally pick a model.
12. **Where this README is silent, ask the human operator.** Don't invent architecture.

---

## 20. Acceptance Criteria (frontend-relevant subset)

- `clearclaim-frontend` and `clearclaim-api` deploy independently from separate repos.
- Welcome email link from the backend lands on `/auth/set-password`, applies the action code, sets a password, and redirects to `/auth/login`.
- First login after set-password forces phone enrollment (no MFA enrolled → `/auth/enroll-phone`).
- Subsequent logins prompt for email + password followed by SMS OTP entry.
- QR scan: desktop creates session, QR renders, phone visits URL without login, image uploads, desktop polls and receives extracted result, fields populate with confidence indicators.
- Scan session expires after 10 minutes — phone gets 410, desktop shows expired state with "Generate New QR Code".
- Patient self-service intake: phone visits `/intake/{token}` without login, submits form, lands in front-desk pending submissions list.
- Practice owner can regenerate intake_token; old URL pushes to `/intake/not-found` (410 handling).
- CSV import respects per-practice row limit; over-limit shows the specific error screen.
- CSV column mapping UI shows raw headers, auto-suggests fields, allows full override.
- Claim worklist shows action-required claims first; per-status quick actions render correctly.
- Three-layer validation page renders Layer 1 / 2 / 3 in order; "Submit" disabled if any errors.
- Appeals editor autosaves while editing; "Mark as Sent" transitions claim to `appealed`.
- Admin dashboard / practice detail / user management screens are visually distinct from practice screens.

---

*End of README. The companion documents are the technical specification and the backend README — frontend behavior is governed here; backend behavior there; the spec is the tie-breaker.*
