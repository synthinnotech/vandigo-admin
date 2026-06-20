import axiosInstance from './axiosInstance';

export const login = (phone, password) =>
  axiosInstance.post('/api/v1/auth/login', { phone, password });

export const logout = () => {
  localStorage.removeItem('vandigo_access_token');
  localStorage.removeItem('vandigo_refresh_token');
};
