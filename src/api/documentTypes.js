import axiosInstance from './axiosInstance';

export const getDocumentTypes = () => axiosInstance.get('/api/v1/document-types');
export const createDocumentType = (data) => axiosInstance.post('/api/v1/document-types', data);
