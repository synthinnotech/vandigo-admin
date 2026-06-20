import axiosInstance from './axiosInstance';

export const getWithdrawals = (params) => axiosInstance.get('/api/v1/admin/withdrawals', { params });
export const processWithdrawal = (withdrawalId, data) =>
  axiosInstance.patch(`/api/v1/admin/withdrawals/${withdrawalId}`, data);
