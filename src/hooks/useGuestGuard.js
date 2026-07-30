import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/authNavigation';

/**
 * Redirects signed-in users away from guest-only pages (login, mfa-verify).
 */
export function useGuestGuard() {
  const { isAuthenticated, profile, mfaEnrolled, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    if (!mfaEnrolled) {
      navigate('/mfa-enroll', { replace: true });
      return;
    }
    const path = dashboardPath(profile);
    if (path) navigate(path, { replace: true });
  }, [isAuthenticated, profile, mfaEnrolled, loading, navigate]);

  return { loading };
}
