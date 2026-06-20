import axiosInstance from './axiosInstance';

export const getRides = (params) => axiosInstance.get('/api/v1/rides', { params });
export const getRide = (rideId) => axiosInstance.get(`/api/v1/rides/${rideId}`);
