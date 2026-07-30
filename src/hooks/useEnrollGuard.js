import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Requires sign-in for MFA enrollment pages.
 */
export function useEnrollGuard() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, loading, navigate]);

  return { loading };
}
