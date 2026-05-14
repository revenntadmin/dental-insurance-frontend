import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  profile: null,
  id_token: null,
  is_admin: false,
  mfa_enrolled: false,
  is_loading: true,
  refresh_profile: async () => {},
});
