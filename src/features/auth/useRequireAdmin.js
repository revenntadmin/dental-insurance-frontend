import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useRequireAdmin() {
  const navigate = useNavigate();
  const { user, profile, is_loading, is_admin } = useAuth();
  useEffect(() => {
    if (is_loading) return;
    if (!user) {
      navigate('/auth/login', { replace: true });
      return;
    }
    if (profile && !is_admin) {
      navigate('/auth/access-denied', { replace: true });
    }
  }, [user, profile, is_admin, is_loading, navigate]);
  return { is_admin, is_loading };
}
