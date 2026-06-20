import axiosInstance from './axiosInstance';

export const getStats = () => axiosInstance.get('/api/v1/admin/stats');
export const getHealth = () => axiosInstance.get('/api/v1/health');
