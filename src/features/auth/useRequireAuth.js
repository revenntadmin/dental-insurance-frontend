import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useRequireAuth() {
  const navigate = useNavigate();
  const { user, is_loading } = useAuth();
  useEffect(() => {
    if (!is_loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, is_loading, navigate]);
  return { user, is_loading };
}
