import axiosInstance from './axiosInstance';

export const getUsers = (params) => axiosInstance.get('/api/v1/users', { params });
export const getCurrentUser = () => axiosInstance.get('/api/v1/users/current_user');
export const updateCurrentUser = (data) => axiosInstance.patch('/api/v1/users/current_user', data);
export const changePassword = (data) => axiosInstance.post('/api/v1/users/current_user/change-password', data);
export const uploadProfilePicture = (file) => {
  const fd = new FormData();
  fd.append('photo', file);
  return axiosInstance.post('/api/v1/users/profile-picture', fd);
};
export const activateUser = (userId) => axiosInstance.patch(`/api/v1/admin/users/${userId}/activate`);
export const deactivateUser = (userId) => axiosInstance.patch(`/api/v1/admin/users/${userId}/deactivate`);
