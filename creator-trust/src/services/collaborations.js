// src/services/collaborations.js
import api from './api';

export const collaborationsService = {
  mine: () => api.get('/collaborations/mine'),
  getById: (id) => api.get(`/collaborations/${id}`),
  submitDeliverable: (id, deliverable_url) => api.post(`/collaborations/${id}/submit`, { deliverable_url }),
  verify: (id) => api.post(`/collaborations/${id}/verify`),
  complete: (id, rating) => api.post(`/collaborations/${id}/complete`, { rating }),
};
