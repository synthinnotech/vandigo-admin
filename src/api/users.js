import axiosInstance from './axiosInstance';

export const getUsers = () => axiosInstance.get('/api/v1/users');
export const getCurrentUser = () => axiosInstance.get('/api/v1/users/current_user');
export const updateCurrentUser = (data) => axiosInstance.patch('/api/v1/users/current_user', data);
export const activateUser = (userId) => axiosInstance.patch(`/api/v1/admin/users/${userId}/activate`);
export const deactivateUser = (userId) => axiosInstance.patch(`/api/v1/admin/users/${userId}/deactivate`);
