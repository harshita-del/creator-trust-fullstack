// src/services/campaigns.js
import api from './api';

export const campaignsService = {
  list: () => api.get('/campaigns'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (payload) => api.post('/campaigns', payload),
  getMatches: (id) => api.get(`/campaigns/${id}/matches`),
  updateStatus: (id, status) => api.patch(`/campaigns/${id}/status`, { status }),
};
