import axios from 'axios';
import { auth } from './firebase.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Firebase will refresh tokens silently; a true 401 means session is gone.
      // Surface the error; ProtectedRoute will redirect when auth state clears.
    }
    return Promise.reject(err);
  }
);

// Public client: no auth header. Used for /scan/:token and /intake/:token endpoints.
export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
