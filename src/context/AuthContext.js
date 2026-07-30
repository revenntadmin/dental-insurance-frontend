import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, multiFactor } from 'firebase/auth';
import { auth } from '../firebase';
import apiClient from '../api/apiClient';
import { skipMfa } from '../lib/mfa';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return null;
    }
    try {
      if (multiFactor(auth.currentUser).enrolledFactors.length > 0) {
        setMfaEnrolled(true);
      }
      const { data } = await apiClient.get('/api/auth/me');
      setProfile(data.user);
      if (data.user?.mfa_enrolled) {
        setMfaEnrolled(true);
      }
      return data.user;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setMfaEnrolled(false);
        setLoading(false);
        return;
      }

      const enrolledInFirebase = multiFactor(user).enrolledFactors.length > 0;
      setMfaEnrolled(enrolledInFirebase);

      try {
        const { data } = await apiClient.get('/api/auth/me');
        setProfile(data.user);
        if (data.user?.mfa_enrolled) {
          setMfaEnrolled(true);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = {
    firebaseUser,
    profile,
    role: profile?.role ?? null,
    mfaEnrolled: skipMfa || mfaEnrolled,
    loading,
    isAuthenticated: Boolean(firebaseUser),
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
