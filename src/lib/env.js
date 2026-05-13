function required(key) {
  const value = import.meta.env[key];
  if (!value) {
    // eslint-disable-next-line no-console
    console.warn(`[env] missing required ${key}`);
  }
  return value || '';
}

export const env = {
  api_base_url: required('VITE_API_BASE_URL') || 'http://localhost:3001',
  app_public_url: import.meta.env.VITE_APP_PUBLIC_URL || window.location.origin,
  firebase: {
    api_key: required('VITE_FIREBASE_API_KEY'),
    auth_domain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    project_id: required('VITE_FIREBASE_PROJECT_ID'),
    tenant_id: import.meta.env.VITE_FIREBASE_TENANT_ID || '',
  },
  sentry_dsn: import.meta.env.VITE_SENTRY_DSN || '',
};
