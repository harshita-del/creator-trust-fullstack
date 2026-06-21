// src/services/stats.js
import api from './api';

export const statsService = {
  platform: () => api.get('/stats/platform'),
  dashboard: () => api.get('/stats/dashboard'),
};
