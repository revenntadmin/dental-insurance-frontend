import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, multiFactor } from 'firebase/auth';
import { auth } from '../firebase';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setMfaEnrolled(null);
        setLoading(false);
        return;
      }

      setMfaEnrolled(multiFactor(user).enrolledFactors.length > 0);

      try {
        const { data } = await apiClient.get('/api/auth/me');
        setProfile(data.user);
      } catch (err) {
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
    mfaEnrolled,
    loading,
    isAuthenticated: Boolean(firebaseUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
