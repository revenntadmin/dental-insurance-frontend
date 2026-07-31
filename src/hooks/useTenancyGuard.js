import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../lib/authNavigation';

/** Ensures the URL practice id matches the signed-in user's practice. */
export function useTenancyGuard() {
  const { pid } = useParams();
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profile) return;
    if (!profile.practice_id) {
      navigate('/login', { replace: true });
      return;
    }
    if (pid && profile.practice_id !== pid) {
      navigate(dashboardPath(profile), { replace: true });
    }
  }, [loading, profile, pid, navigate]);

  return { loading, profile };
}
