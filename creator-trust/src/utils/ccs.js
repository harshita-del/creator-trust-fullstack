// src/utils/ccs.js
// Shared CCS presentation helpers — keeps tier thresholds/colors
// consistent with the backend's utils/ccsEngine.js (0-25 Risky,
// 25-50 Fair, 50-75 Good, 75-100 Trusted).

export function ccsTier(score) {
  if (score <= 25) return 'Risky';
  if (score <= 50) return 'Fair';
  if (score <= 75) return 'Good';
  return 'Trusted';
}

export function ccsColorVar(score) {
  if (score <= 25) return 'var(--risk-red-bright)';
  if (score <= 50) return 'var(--caution-amber)';
  if (score <= 75) return 'var(--ledger-gold-bright)';
  return 'var(--trust-green-bright)';
}

export const CCS_FACTORS = [
  { key: 'audience_quality_score', label: 'Audience Quality', hint: 'Follower size vs. estimated fake-follower share' },
  { key: 'engagement_auth_score', label: 'Engagement Authenticity', hint: 'How natural the like/comment rate looks for this audience size' },
  { key: 'campaign_history_score', label: 'Campaign History', hint: 'Completion rate and ratings from past collaborations' },
  { key: 'fraud_detection_score', label: 'Fraud Detection', hint: 'Composite risk signal — higher is safer' },
  { key: 'brand_reliability_score', label: 'Brand Reliability Feedback', hint: 'How brands have rated working with this creator' },
];
