import axiosInstance from './axiosInstance';

export const getPlans = () => axiosInstance.get('/api/v1/admin/plans');
export const createPlan = (data) => axiosInstance.post('/api/v1/admin/plans', data);
export const updatePlan = (planId, data) => axiosInstance.patch(`/api/v1/admin/plans/${planId}`, data);
