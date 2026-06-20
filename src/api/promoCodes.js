import axiosInstance from './axiosInstance';

export const getPromoCodes = () => axiosInstance.get('/api/v1/promo-codes');
export const createPromoCode = (data) => axiosInstance.post('/api/v1/promo-codes', data);
export const updatePromoCode = (promoId, data) => axiosInstance.patch(`/api/v1/promo-codes/${promoId}`, data);
