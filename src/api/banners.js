import axiosInstance from './axiosInstance';

export const getBannersAdmin = () => axiosInstance.get('/api/v1/banners/admin');
export const createBanner = (data) => axiosInstance.post('/api/v1/banners', data);
export const updateBanner = (bannerId, data) => axiosInstance.patch(`/api/v1/banners/${bannerId}`, data);
export const deleteBanner = (bannerId) => axiosInstance.delete(`/api/v1/banners/${bannerId}`);

export const uploadBannerImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post('/api/v1/upload/banner', fd);
};
