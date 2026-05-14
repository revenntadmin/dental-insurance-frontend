import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Requires the user to be signed in. Used on enrollment pages (enroll-phone, enroll-verify).
 * - Not signed in → /auth/login
 * Returns { is_loading } so pages can avoid rendering before the check completes.
 */
export function useEnrollGuard() {
  const { user, is_loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (is_loading) return;
    if (!user) navigate('/auth/login', { replace: true });
  }, [user, is_loading, navigate]);

  return { is_loading };
}
