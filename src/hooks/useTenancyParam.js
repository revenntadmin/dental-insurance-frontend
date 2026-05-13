import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from './useToast';

export function useTenancyParam() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { profile, is_admin, is_loading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (is_loading || !profile || !pid) return;
    if (is_admin) return;
    if (pid !== profile.practice_id) {
      toast.error("You don't have access to that practice.");
      navigate(`/p/${profile.practice_id}/dashboard`, { replace: true });
    }
  }, [pid, profile, is_admin, is_loading, navigate, toast]);

  return pid;
}
