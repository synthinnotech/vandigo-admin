import axiosInstance from './axiosInstance';

export const getOffers = () => axiosInstance.get('/api/v1/offers');
export const getOffersAdmin = () => axiosInstance.get('/api/v1/offers/admin');
export const createOffer = (data) => axiosInstance.post('/api/v1/offers', data);
export const updateOffer = (offerId, data) => axiosInstance.patch(`/api/v1/offers/${offerId}`, data);
export const deleteOffer = (offerId) => axiosInstance.delete(`/api/v1/offers/${offerId}`);
