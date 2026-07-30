import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

if (import.meta.env.VITE_FIREBASE_TENANT_ID) {
  auth.tenantId = import.meta.env.VITE_FIREBASE_TENANT_ID;
}

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_PHONE_AUTH_TESTING === 'true') {
  // Use with fictional numbers from Firebase Console → Auth → Phone numbers for testing.
  auth.settings.appVerificationDisabledForTesting = true;
}

const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
if (import.meta.env.DEV && emulatorHost) {
  connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
}

export { app, auth };
