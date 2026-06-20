import axiosInstance from './axiosInstance';

export const getTickets = (params) => axiosInstance.get('/api/v1/support/tickets', { params });
export const getTicket = (ticketId) => axiosInstance.get(`/api/v1/support/tickets/${ticketId}`);
export const replyToTicket = (ticketId, data) =>
  axiosInstance.post(`/api/v1/support/tickets/${ticketId}/messages`, data);
