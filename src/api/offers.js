import axiosInstance from './axiosInstance';

export const getOffers = () => axiosInstance.get('/api/v1/offers');
