import axios from 'axios';
import { getCsrfTokenFromCookie } from '@/utils/getCsrfTokenFromCookie';

const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method as string)) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await axiosInstance.post('/auth/logout').catch(() => {});
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
