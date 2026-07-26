import axiosInstance from './axiosInstance';

export const getRideAlerts = (params) => axiosInstance.get('/api/v1/ride-alerts', { params });
export const resolveRideAlert = (alertId, data) => axiosInstance.patch(`/api/v1/ride-alerts/${alertId}`, data);
