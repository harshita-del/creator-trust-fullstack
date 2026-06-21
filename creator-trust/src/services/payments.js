// src/services/payments.js
import api from './api';

export const paymentsService = {
  createOrder: (collaborationId) => api.post(`/payments/${collaborationId}/create-order`),
  verify: (payload) => api.post('/payments/verify', payload),
  release: (collaborationId) => api.post(`/payments/${collaborationId}/release`),
  forCollaboration: (collaborationId) => api.get(`/payments/collaboration/${collaborationId}`),
};
