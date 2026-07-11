import axiosInstance from './axiosInstance';

export const getAllDrivers = (params) => axiosInstance.get('/api/v1/drivers', { params });
export const getPendingDrivers = () => axiosInstance.get('/api/v1/drivers/admin/pending');
export const approveDriver = (driverId) => axiosInstance.post(`/api/v1/drivers/${driverId}/approve`);
export const getDriverDocuments = (driverId) => axiosInstance.get(`/api/v1/admin/drivers/${driverId}/documents`);
export const reviewDocument = (docId, data) => axiosInstance.patch(`/api/v1/admin/documents/${docId}/review`, data);
