/** Set VITE_SKIP_MFA=true to bypass phone MFA enrollment during local development. */
export const skipMfa = import.meta.env.VITE_SKIP_MFA === 'true';

/** Bypasses reCAPTCHA — only works with fictional numbers in Firebase Console. */
export const phoneAuthTesting = import.meta.env.VITE_FIREBASE_PHONE_AUTH_TESTING === 'true';

/** Optional hint shown on the MFA enroll page during local testing. */
export const testPhoneNumber = import.meta.env.VITE_FIREBASE_TEST_PHONE || '';
