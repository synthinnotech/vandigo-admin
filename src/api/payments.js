import axiosInstance from './axiosInstance';

export const getPayments = (params) => axiosInstance.get('/api/v1/payments', { params });
export const getPayment = (paymentId) => axiosInstance.get(`/api/v1/payments/${paymentId}`);
