import {
  signInWithEmailAndPassword,
  signOut,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  RecaptchaVerifier,
  getMultiFactorResolver,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import { phoneAuthTesting } from './mfa';

export { auth };

let activeRecaptcha = null;

async function clearRecaptcha() {
  if (activeRecaptcha) {
    try {
      await activeRecaptcha.clear();
    } catch {
      /* ignore */
    }
    activeRecaptcha = null;
  }
}

/** Replace the container node so grecaptcha forgets prior renders on retry. */
function resetRecaptchaContainer(recaptchaElId) {
  const container = document.getElementById(recaptchaElId);
  if (!container?.parentNode) return null;
  const fresh = container.cloneNode(false);
  container.parentNode.replaceChild(fresh, container);
  return fresh;
}

async function createRecaptcha(recaptchaElId) {
  if (activeRecaptcha && phoneAuthTesting) {
    return activeRecaptcha;
  }

  await clearRecaptcha();

  // Replacing the DOM node breaks Firebase's mock reCAPTCHA in testing mode.
  const container = phoneAuthTesting
    ? document.getElementById(recaptchaElId)
    : resetRecaptchaContainer(recaptchaElId);

  if (!container) {
    throw new Error('reCAPTCHA container not found. Refresh the page and try again.');
  }

  if (!phoneAuthTesting) {
    container.innerHTML = '';
  }

  activeRecaptcha = new RecaptchaVerifier(auth, container, {
    size: phoneAuthTesting ? 'normal' : 'invisible',
  });
  await activeRecaptcha.render();
  return activeRecaptcha;
}

function wrapPhoneAuthError(err) {
  if (err?.code === 'auth/captcha-check-failed') {
    const hints = phoneAuthTesting
      ? [
          'Testing mode is on — use a fictional test number from Firebase Console (Authentication → Sign-in method → Phone numbers for testing), not your real phone.',
          testPhoneHint(),
        ]
      : [
          'Use http://127.0.0.1:5173 and add 127.0.0.1 to Firebase Authorized domains.',
          'For local dev, set VITE_FIREBASE_PHONE_AUTH_TESTING=true and use a Firebase test phone number.',
        ];
    const error = new Error(`reCAPTCHA verification failed: ${hints.join(' ')}`);
    error.code = err.code;
    throw error;
  }

  if (err?.code !== 'auth/invalid-app-credential') {
    throw err;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const hints = [
    'Open the app at http://127.0.0.1:5173 (not localhost) and add 127.0.0.1 under Firebase → Authentication → Settings → Authorized domains.',
    'In Firebase Console, enable Phone sign-in and SMS multi-factor authentication.',
    `For local dev, add a test phone in Firebase Console and set VITE_FIREBASE_PHONE_AUTH_TESTING=true. ${testPhoneHint()}`,
  ];

  if (host === 'localhost') {
    hints.unshift('Your browser is on localhost — switch to http://127.0.0.1:5173.');
  }

  const error = new Error(`Phone verification failed: ${hints.join(' ')}`);
  error.code = err.code;
  throw error;
}

function testPhoneHint() {
  const configured = import.meta.env.VITE_FIREBASE_TEST_PHONE;
  return configured
    ? `Use ${configured} with the verification code configured in Firebase.`
    : 'Example: register +1 650-555-3434 with code 123456, then enter +16505553434.';
}

async function verifyPhoneNumber(phoneProvider, request, recaptcha) {
  try {
    return await phoneProvider.verifyPhoneNumber(request, recaptcha);
  } catch (err) {
    wrapPhoneAuthError(err);
  }
}

export async function login(email, password, recaptchaElId) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const factors = multiFactor(cred.user).enrolledFactors;
    if (factors.length === 0) return { status: 'enroll_required', user: cred.user };
    return { status: 'success', user: cred.user };
  } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      if (!recaptchaElId) {
        return { status: 'mfa_required' };
      }
      const resolver = getMultiFactorResolver(auth, err);
      const hint = resolver.hints[0];
      const recaptcha = await createRecaptcha(recaptchaElId);
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await verifyPhoneNumber(
        phoneProvider,
        { multiFactorHint: hint, session: resolver.session },
        recaptcha,
      );
      return {
        status: 'mfa_required',
        verificationId,
        resolver,
        phoneLastFour: hint.phoneNumber.slice(-4),
      };
    }
    throw err;
  }
}

export async function completeMfa(verificationId, otp, resolver) {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  return (await resolver.resolveSignIn(assertion)).user;
}

export async function startPhoneEnrollment(phoneNumber, recaptchaElId) {
  const session = await multiFactor(auth.currentUser).getSession();
  const recaptcha = await createRecaptcha(recaptchaElId);
  const phoneProvider = new PhoneAuthProvider(auth);
  return verifyPhoneNumber(phoneProvider, { phoneNumber, session }, recaptcha);
}

export async function completePhoneEnrollment(verificationId, otp) {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  await multiFactor(auth.currentUser).enroll(assertion, 'Phone');
}

export async function reauthenticate(password) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('not_signed_in');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export const logout = () => signOut(auth);
