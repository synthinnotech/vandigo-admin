import axios from 'axios';

const DEFAULT_BASE_URL = 'http://localhost:8000';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const baseURL = localStorage.getItem('vandigo_api_url') || DEFAULT_BASE_URL;
  const token = localStorage.getItem('vandigo_access_token');
  config.baseURL = baseURL;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
