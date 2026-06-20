import axiosInstance from './axiosInstance';

export const getUnreadCount = () => axiosInstance.get('/api/v1/notifications/unread-count');
export const getNotifications = (params) => axiosInstance.get('/api/v1/notifications', { params });
export const markAllRead = () => axiosInstance.post('/api/v1/notifications/read-all');
export const markOneRead = (notificationId) =>
  axiosInstance.patch(`/api/v1/notifications/${notificationId}/read`);
