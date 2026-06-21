// src/services/creators.js
import api from './api';

export const creatorsService = {
  getMyProfile: () => api.get('/creators/me'),
  updateMyProfile: (fields) => api.put('/creators/me', fields),
  recalculateCCS: () => api.post('/creators/me/recalculate-ccs'),
  getById: (id) => api.get(`/creators/${id}`),
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/creators${qs ? `?${qs}` : ''}`);
  },
};
