import { useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, multiFactor } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api_client';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, set_user] = useState(null);
  const [profile, set_profile] = useState(null);
  const [id_token, set_id_token] = useState(null);
  const [is_loading, set_is_loading] = useState(true);

  const load_profile = useCallback(async (fb_user) => {
    if (!fb_user) {
      set_profile(null);
      set_id_token(null);
      return;
    }
    try {
      const token = await fb_user.getIdToken();
      set_id_token(token);
      const { data } = await api.get('/api/me');
      set_profile(data);
    } catch {
      set_profile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb_user) => {
      set_user(fb_user);
      await load_profile(fb_user);
      set_is_loading(false);
    });
    return unsub;
  }, [load_profile]);

  const refresh_profile = useCallback(async () => {
    if (user) await load_profile(user);
  }, [user, load_profile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      id_token,
      is_admin: profile?.role === 'clearclaim_admin',
      mfa_enrolled: user ? multiFactor(user).enrolledFactors.length > 0 : false,
      is_loading,
      refresh_profile,
    }),
    [user, profile, id_token, is_loading, refresh_profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
