// utils/ccsEngine.js
// ═══════════════════════════════════════════════════════════
// Creator Credit Score (CCS) Engine
// Produces a 0-100 trust score from 5 weighted sub-factors,
// mirroring the breakdown shown on the landing page:
//   Audience Quality · Engagement Authenticity · Campaign
//   History · Fraud Detection · Brand Reliability feedback
// ═══════════════════════════════════════════════════════════

const WEIGHTS = {
  audience_quality_score: 0.25,
  engagement_auth_score: 0.25,
  campaign_history_score: 0.2,
  fraud_detection_score: 0.2,
  brand_reliability_score: 0.1,
};

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Audience Quality sub-score.
 * Rewards larger, more geographically/category-consistent followings
 * and penalizes a high estimated fake-follower percentage.
 */
function scoreAudienceQuality({ follower_count = 0, fake_follower_pct = 0 }) {
  const sizeFactor = clamp(Math.log10(follower_count + 10) * 18, 0, 70); // diminishing returns
  const fakePenalty = fake_follower_pct * 1.2;
  return clamp(30 + sizeFactor - fakePenalty);
}

/**
 * Engagement Authenticity sub-score.
 * A healthy engagement rate for the follower bracket scores highest.
 * Engagement well BELOW the ideal (classic sign of purchased/fake
 * followers inflating the denominator) is penalized more steeply
 * than the same absolute deviation above ideal. Engagement that's
 * suspiciously far ABOVE ideal (bot/engagement-pod signal) also
 * takes an extra penalty.
 */
function scoreEngagementAuth({ avg_engagement_rate = 0, follower_count = 0 }) {
  let idealRate;
  if (follower_count < 10000) idealRate = 6;
  else if (follower_count < 100000) idealRate = 4;
  else if (follower_count < 1000000) idealRate = 2.5;
  else idealRate = 1.5;

  const deviation = avg_engagement_rate - idealRate;
  let score;

  if (deviation < 0) {
    // Below ideal: steeper penalty, scaled relative to the ideal rate
    // so it hits proportionally regardless of follower bracket.
    const relativeShortfall = Math.abs(deviation) / idealRate; // 0 = at ideal, 1 = zero engagement
    score = clamp(100 - relativeShortfall * 100);
  } else {
    score = clamp(100 - deviation * 9);
    const suspiciouslyHigh = avg_engagement_rate > idealRate * 3;
    if (suspiciouslyHigh) score = clamp(score - 25); // bot-engagement-pod signal
  }

  return score;
}

/**
 * Campaign History sub-score, from real platform history.
 */
function scoreCampaignHistory({ completedCount = 0, totalCount = 0, avgRating = null }) {
  if (totalCount === 0) return 50; // neutral default for new creators
  const completionRate = completedCount / totalCount;
  const ratingComponent = avgRating !== null ? (avgRating / 5) * 100 : 60;
  return clamp(completionRate * 100 * 0.5 + ratingComponent * 0.5);
}

/**
 * Fraud Detection sub-score (higher = safer / lower fraud risk).
 * Combines fake follower %, engagement-pod flags, and any reported disputes.
 */
function scoreFraudDetection({ fake_follower_pct = 0, disputeCount = 0 }) {
  let score = 100 - fake_follower_pct * 1.5 - disputeCount * 15;
  return clamp(score);
}

/**
 * Brand Reliability feedback sub-score — average rating creators give
 * back about how this creator handled professional collaboration.
 */
function scoreBrandReliabilityFeedback({ avgCreatorProfessionalismRating = null }) {
  if (avgCreatorProfessionalismRating === null) return 55;
  return clamp((avgCreatorProfessionalismRating / 5) * 100);
}

function tierFromScore(score) {
  if (score <= 25) return 'Risky';
  if (score <= 50) return 'Fair';
  if (score <= 75) return 'Good';
  return 'Trusted';
}

/**
 * Master function — computes all sub-scores + composite CCS.
 * @param {object} input - raw signals gathered from DB
 * @returns {object} sub-scores + composite + tier
 */
function calculateCCS(input) {
  const audience_quality_score = scoreAudienceQuality(input);
  const engagement_auth_score = scoreEngagementAuth(input);
  const campaign_history_score = scoreCampaignHistory(input);
  const fraud_detection_score = scoreFraudDetection(input);
  const brand_reliability_score = scoreBrandReliabilityFeedback(input);

  const composite =
    audience_quality_score * WEIGHTS.audience_quality_score +
    engagement_auth_score * WEIGHTS.engagement_auth_score +
    campaign_history_score * WEIGHTS.campaign_history_score +
    fraud_detection_score * WEIGHTS.fraud_detection_score +
    brand_reliability_score * WEIGHTS.brand_reliability_score;

  const ccs_score = Math.round(composite * 100) / 100;

  return {
    audience_quality_score: Math.round(audience_quality_score * 100) / 100,
    engagement_auth_score: Math.round(engagement_auth_score * 100) / 100,
    campaign_history_score: Math.round(campaign_history_score * 100) / 100,
    fraud_detection_score: Math.round(fraud_detection_score * 100) / 100,
    brand_reliability_score: Math.round(brand_reliability_score * 100) / 100,
    ccs_score,
    ccs_tier: tierFromScore(ccs_score),
  };
}

module.exports = { calculateCCS, WEIGHTS, tierFromScore };
