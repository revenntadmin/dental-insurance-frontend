import axios from 'axios';
import { auth } from '../firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const idToken = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

export default apiClient;
