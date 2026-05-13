import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { env } from './env';

export const firebase_app = initializeApp({
  apiKey: env.firebase.api_key,
  authDomain: env.firebase.auth_domain,
  projectId: env.firebase.project_id,
});

export const auth = getAuth(firebase_app);
if (env.firebase.tenant_id) {
  auth.tenantId = env.firebase.tenant_id;
}
