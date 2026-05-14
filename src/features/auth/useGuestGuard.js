import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { dashboard_path } from './authNavigation';

/**
 * Redirects signed-in users away from guest-only pages (login, forgot-pw, reset-pw, set-pw).
 * - Signed in, no MFA enrolled  → /auth/enroll-phone
 * - Signed in, MFA enrolled     → dashboard
 * Returns { is_loading } so pages can avoid a flash before the redirect fires.
 */
export function useGuestGuard() {
  const { user, profile, mfa_enrolled, is_loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (is_loading || !user) return;
    if (!mfa_enrolled) {
      navigate('/auth/enroll-phone', { replace: true });
      return;
    }
    const path = dashboard_path(profile);
    if (path) navigate(path, { replace: true });
  }, [user, profile, mfa_enrolled, is_loading, navigate]);

  return { is_loading };
}
