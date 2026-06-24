import axios from 'axios';

const PROD_BASE_URL = 'https://splotchy-whole-sublime.ngrok-free.dev';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const storedUrl = localStorage.getItem('vandigo_api_url');
  const isDev = process.env.NODE_ENV === 'development';
  config.baseURL = isDev ? '' : (storedUrl || PROD_BASE_URL);
  const token = localStorage.getItem('vandigo_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!isDev) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vandigo_access_token');
      localStorage.removeItem('vandigo_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
