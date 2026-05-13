# clearclaim-frontend

React 18 frontend for ClearClaim — AI-powered dental insurance billing platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18, JavaScript (ES2022+) |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Data Fetching | React Query (TanStack Query v5) |
| HTTP Client | Axios |
| Auth | Firebase Auth (Google Cloud Identity Platform) |
| QR Codes | qrcode.react |
| Forms | React Hook Form |
| PWA | manifest.json (scan page installable on mobile) |

---

## Prerequisites

- Node.js 20+
- npm 10+ or yarn
- Access to the `clearclaim-api` backend (running locally or on GCP Cloud Run)
- Firebase project credentials (provided by your ClearClaim admin)

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/clearclaim-frontend.git
cd clearclaim-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Start development server
npm run dev
# App runs at http://localhost:5173
```

---

## Environment Variables

Create a `.env.local` file in the root (never commit this file):

```env
# API backend URL
VITE_API_URL=http://localhost:3001

# Firebase / Google Cloud Identity Platform
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=clearclaim-prod
```

> All frontend env vars must be prefixed with `VITE_` to be exposed by Vite.

---

## Project Structure

```
clearclaim-frontend/
├── public/
│   ├── manifest.json          # PWA manifest — enables /scan homescreen install
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── components/            # Shared UI components
│   │   ├── ui/                # Buttons, inputs, modals, badges
│   │   ├── layout/            # Sidebar, topbar, page shell
│   │   └── shared/            # Confidence indicator, status badge, etc.
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx          # Email/password + MFA flow
│   │   │   ├── EnrollPhonePage.jsx    # First-login phone enrollment
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── admin/
│   │   │   ├── PracticesPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── IntegrationsPage.jsx
│   │   │   ├── SystemConfigPage.jsx
│   │   │   └── AuditLogsPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx      # KPI metrics + claims worklist
│   │   ├── patients/
│   │   │   ├── PatientListPage.jsx
│   │   │   ├── PatientDetailPage.jsx
│   │   │   ├── PatientEntryPage.jsx   # Manual | Upload | QR Scan
│   │   │   ├── InsuranceEntryPage.jsx
│   │   │   ├── ImportPage.jsx         # CSV import flow
│   │   │   └── IntakeSubmissionsPage.jsx  # Review patient self-service submissions
│   │   ├── scan/
│   │   │   └── ScanPage.jsx           # QR scan landing — phone opens after scanning QR
│   │   ├── intake/
│   │   │   └── IntakePage.jsx         # Patient self-service intake form (public, no login)
│   │   ├── pre_procedure/
│   │   │   ├── PreProcedureListPage.jsx
│   │   │   └── PreProcedureDetailPage.jsx
│   │   ├── claims/
│   │   │   ├── ClaimsWorklistPage.jsx
│   │   │   ├── ClaimDetailPage.jsx
│   │   │   ├── ClaimCreatePage.jsx
│   │   │   └── AppealPage.jsx
│   │   └── providers/
│   │       └── ProviderListPage.jsx
│   ├── features/
│   │   ├── auth/              # Auth context, hooks, protected route wrapper
│   │   ├── patients/          # Patient state and query hooks
│   │   ├── claims/            # Claim state and query hooks
│   │   └── scan/              # QR session polling logic
│   ├── hooks/
│   │   ├── use_practice.js    # Current practice context
│   │   ├── use_polling.js     # Generic interval poller (used for QR scan sessions)
│   │   └── use_toast.js
│   └── lib/
│       ├── auth.js            # Firebase Auth helpers (login, MFA, enrollment)
│       └── api_client.js      # Axios instance with auto ID token attachment
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Authentication Flow

ClearClaim uses Google Cloud Identity Platform (Firebase Auth) with **mandatory SMS two-factor authentication**.

### Login sequence
1. User enters email + password
2. If 2FA enrolled: Firebase sends SMS OTP → user enters code → access granted
3. If 2FA not yet enrolled (first login): user is redirected to phone enrollment before accessing the app

### Phone enrollment (first login)
1. User enters their phone number
2. Firebase sends an SMS verification code
3. User enters the code — phone is enrolled
4. User is redirected to the dashboard

### Token handling
- Firebase issues a short-lived ID token after successful login (including 2FA)
- `api_client.js` intercepts every Axios request and attaches the current token via `Authorization: Bearer <token>`
- Firebase SDK silently refreshes the token before expiry — no manual refresh logic needed

---

## QR Camera Scan Flow

The "Scan with Phone" feature on the desktop patient entry page works without the phone being logged in:

1. Front desk clicks **Scan with Phone** on the desktop
2. Desktop calls `POST /api/practice/:pid/scan_sessions` → receives a `qr_url` with a secure one-time token
3. A QR code renders on screen from the `qr_url`
4. Front desk (or patient) scans with any phone — browser opens `app.clearclaim.io/scan/{token}`
5. Phone shows a camera capture UI (no login required)
6. Photo is uploaded via `POST /api/scan/:token/upload`
7. Desktop polls `GET /api/practice/:pid/scan_sessions/:session_id` every 2 seconds
8. When session `status === 'completed'`, extracted fields populate the desktop form automatically
9. Front desk reviews confidence-scored fields and confirms

> QR sessions expire after **10 minutes**. Clicking "Generate New QR Code" creates a fresh session.

---

## Patient Self-Service Intake

Each practice has a permanent intake URL: `https://app.clearclaim.io/intake/{practice_intake_token}`

- The `/intake/:token` route is **public** — no login required
- Patients fill in demographics and insurance info on their phone in the waiting room
- Submissions are saved as `pending_review` and appear as alerts on the front desk dashboard
- Front desk reviews, edits if needed, and confirms to create the patient record
- Practice owners can regenerate the intake token (invalidates old URL) from Practice Settings

---

## CSV Patient Import

Bulk import patients from any PMS export:

1. **Upload** — select a CSV file (limit: 5,000 rows by default, configurable per practice by admin)
2. **Map Columns** — server returns raw CSV headers; UI shows mapping UI with auto-suggestions; coordinator adjusts any mappings
3. **Validate** — server validates all rows against the confirmed mapping; returns per-row results
4. **Preview** — review ready / warning / error rows; toggle skips per row; download error report
5. **Confirm** — writes all valid and unskipped rows in a single DB transaction

### Downloading the template
```
GET /api/practice/:pid/patients/import/template
```
Download the canonical ClearClaim CSV template with all expected column names.

---

## Available Scripts

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build to /dist
npm run preview      # Preview production build locally
npm run lint         # ESLint
```

---

## PWA / Mobile Scan

The `/scan` route is installable on phone homescreens via the PWA manifest.

To test on mobile:
1. Connect phone to same network as dev machine, or deploy to staging
2. Open `https://<your-url>/scan` in Chrome or Safari on the phone
3. Chrome: "Add to Home Screen" prompt appears automatically
4. Safari: Share → "Add to Home Screen"

The installed icon launches directly to `/scan` in standalone mode (no browser chrome).

---

## Key Conventions

- **snake_case** for all API request/response field names (mirrors the backend)
- **React Query** for all server state — no manual loading flags
- **No localStorage / sessionStorage** for auth — Firebase SDK manages tokens in memory
- Public routes (`/scan/:token`, `/intake/:token`) do not use the `api_client.js` interceptor — they call public endpoints with the token in the URL path
- Confidence scores from AI extraction: `≥ 0.85` green, `0.60–0.84` yellow, `< 0.60` red

---

## Deployment

The frontend deploys to **GCP Cloud Run** as a containerized static server (nginx), or to **Firebase Hosting** for simpler static deployments.

```bash
# Build
npm run build

# Docker build (for Cloud Run)
docker build -t clearclaim-frontend .
docker push gcr.io/clearclaim-prod/clearclaim-frontend

# Or deploy to Firebase Hosting
firebase deploy --only hosting
```

Set the following environment variables in your Cloud Run service or CI/CD pipeline:
```
VITE_API_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
```
