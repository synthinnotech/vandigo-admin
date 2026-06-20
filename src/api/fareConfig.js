import axiosInstance from './axiosInstance';

export const getFareConfigs = () => axiosInstance.get('/api/v1/fare-config');
export const createFareConfig = (data) => axiosInstance.post('/api/v1/fare-config', data);
export const updateFareConfig = (vehicleType, data) => axiosInstance.patch(`/api/v1/fare-config/${vehicleType}`, data);
