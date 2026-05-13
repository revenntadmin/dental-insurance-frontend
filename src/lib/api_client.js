import axios from 'axios';
import { get_id_token, logout } from './auth';
import { env } from './env';

export const api = axios.create({ baseURL: env.api_base_url });

api.interceptors.request.use(async (cfg) => {
  const url = cfg.url || '';
  const is_public = url.startsWith('/api/scan/') || url.startsWith('/api/intake/');
  if (!is_public) {
    const token = await get_id_token();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response } = err;
    if (response?.status === 401 && response?.data?.error === 'mfa_required') {
      try {
        await logout();
      } catch {
        // ignore
      }
      window.location.href = '/auth/login?reason=mfa_required';
    }
    return Promise.reject(err);
  },
);

export function api_error_message(err, fallback = 'Something went wrong.') {
  return err?.response?.data?.message || err?.message || fallback;
}

export function api_error_code(err) {
  return err?.response?.data?.error || null;
}
