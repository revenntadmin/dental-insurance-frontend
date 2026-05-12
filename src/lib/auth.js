import {
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getMultiFactorResolver,
} from 'firebase/auth';
import { auth } from './firebase.js';

let recaptchaVerifier = null;

export function resetRecaptcha() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_e) { /* noop */ }
    recaptchaVerifier = null;
  }
}

function freshRecaptcha() {
  // Dispose the old verifier object but leave its DOM node alone —
  // removing it mid-verification breaks the invisible flow.
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_e) { /* noop */ }
    recaptchaVerifier = null;
  }
  // Give every new verifier its own element so "already rendered" can never fire.
  const div = document.createElement('div');
  document.body.appendChild(div);
  recaptchaVerifier = new RecaptchaVerifier(auth, div, { size: 'invisible' });
  return recaptchaVerifier;
}

export function getRecaptcha() {
  if (recaptchaVerifier) return recaptchaVerifier;
  return freshRecaptcha();
}

export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { status: 'success', user: cred.user };
  } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, err);
      const phoneHint = resolver.hints.find(h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
      if (!phoneHint) throw err;
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        { multiFactorHint: phoneHint, session: resolver.session },
        getRecaptcha()
      );
      return { status: 'mfa_required', resolver, verificationId };
    }
    throw err;
  }
}

export async function completeMfaSignIn(resolver, verificationId, code) {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  const cred = await resolver.resolveSignIn(assertion);
  return cred.user;
}

export async function enrollPhoneStart(user, phoneNumber) {
  const session = await multiFactor(user).getSession();
  const provider = new PhoneAuthProvider(auth);
  // Always use a fresh verifier — reusing a stale one causes captcha-check-failed.
  const verificationId = await provider.verifyPhoneNumber(
    { phoneNumber, session },
    freshRecaptcha()
  );
  return verificationId;
}

export async function enrollPhoneComplete(user, verificationId, code, displayName = 'Phone') {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const assertion = PhoneMultiFactorGenerator.assertion(credential);
  await multiFactor(user).enroll(assertion, displayName);
}

export function isPhoneEnrolled(user) {
  if (!user) return false;
  return multiFactor(user).enrolledFactors.some(f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
}

export async function reauthenticate(user, password) {
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function sendEmailVerificationLink(user) {
  await sendEmailVerification(user);
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
  resetRecaptcha();
}
