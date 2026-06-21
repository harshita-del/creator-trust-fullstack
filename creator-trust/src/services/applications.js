// src/services/applications.js
import api from './api';

export const applicationsService = {
  apply: (campaign_id, pitch_message) => api.post('/applications', { campaign_id, pitch_message }),
  mine: () => api.get('/applications/mine'),
  forCampaign: (campaignId) => api.get(`/applications/campaign/${campaignId}`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
};
