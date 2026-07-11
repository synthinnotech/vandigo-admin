import axios from 'axios';

const PROD_BASE_URL = 'http://168.144.90.65';

function getBaseURL() {
  const storedUrl = localStorage.getItem('vandigo_api_url');
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? '' : (storedUrl || PROD_BASE_URL);
}

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  const token = localStorage.getItem('vandigo_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.NODE_ENV !== 'development') {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
});

function forceLogout() {
  localStorage.removeItem('vandigo_access_token');
  localStorage.removeItem('vandigo_refresh_token');
  window.location.href = '/admin/login';
}

// A stored refresh token stays valid for days, so an expired (30-min) access
// token shouldn't end the session by itself — only a failed refresh (or an
// explicit logout, which clears the refresh token) should.
let refreshPromise = null;

function refreshAccessToken() {
  const refreshToken = localStorage.getItem('vandigo_refresh_token');
  if (!refreshToken) return Promise.reject(new Error('No refresh token available'));

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${getBaseURL()}/api/v1/auth/refresh`, { refresh_token: refreshToken })
      .then(({ data }) => {
        localStorage.setItem('vandigo_access_token', data.access_token);
        localStorage.setItem('vandigo_refresh_token', data.refresh_token);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes('/auth/');

    if (response?.status === 401 && config && !isAuthEndpoint && !config._retry) {
      config._retry = true;
      try {
        const newToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(config);
      } catch {
        forceLogout();
        return Promise.reject(error);
      }
    }

    if (response?.status === 401) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
