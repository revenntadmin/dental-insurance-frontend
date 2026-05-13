import {
  signInWithEmailAndPassword,
  signOut,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  RecaptchaVerifier,
  getMultiFactorResolver,
  applyActionCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from './firebase';

export { auth };

export async function login(email, password, recaptcha_el_id) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const factors = multiFactor(cred.user).enrolledFactors;
    if (factors.length === 0) return { status: 'enroll_required', user: cred.user };
    return { status: 'success', user: cred.user };
  } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, err);
      const hint = resolver.hints[0];
      const recaptcha = new RecaptchaVerifier(auth, recaptcha_el_id, { size: 'invisible' });
      const phone_prov = new PhoneAuthProvider(auth);
      const verification_id = await phone_prov.verifyPhoneNumber(
        { multiFactorHint: hint, session: resolver.session },
        recaptcha,
      );
      return {
        status: 'mfa_required',
        verification_id,
        resolver,
        phone_last_four: hint.phoneNumber.slice(-4),
      };
    }
    throw err;
  }
}

export async function complete_mfa(verification_id, otp, resolver) {
  const cred = PhoneAuthProvider.credential(verification_id, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  return (await resolver.resolveSignIn(assertion)).user;
}

export async function start_phone_enrollment(phone_number, recaptcha_el_id) {
  const session = await multiFactor(auth.currentUser).getSession();
  const recaptcha = new RecaptchaVerifier(auth, recaptcha_el_id, { size: 'invisible' });
  const phone_prov = new PhoneAuthProvider(auth);
  return phone_prov.verifyPhoneNumber({ phoneNumber: phone_number, session }, recaptcha);
}

export async function complete_phone_enrollment(verification_id, otp) {
  const cred = PhoneAuthProvider.credential(verification_id, otp);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(auth.currentUser).enroll(assertion, 'Phone');
}

export async function change_password(current_password, new_password) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('not_signed_in');
  const cred = EmailAuthProvider.credential(user.email, current_password);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, new_password);
}

export const logout = () => signOut(auth);
export const get_id_token = () => auth.currentUser?.getIdToken();
export const apply_action_code = (code) => applyActionCode(auth, code);
export const confirm_password_reset = (code, new_password) =>
  confirmPasswordReset(auth, code, new_password);
export const send_password_reset_email = (email) => sendPasswordResetEmail(auth, email);
