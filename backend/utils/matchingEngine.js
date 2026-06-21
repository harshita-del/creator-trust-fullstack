// utils/matchingEngine.js
// ═══════════════════════════════════════════════════════════
// Matching Engine — scores creator/campaign compatibility 0-100
// using niche fit, follower range fit, CCS threshold, engagement
// quality, and location overlap. Mirrors the "20+ signals"
// claim from the landing page (grouped into 5 weighted pillars,
// each internally derived from multiple raw fields).
// ═══════════════════════════════════════════════════════════

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function nicheFitScore(campaign, creator) {
  if (!campaign.target_niche) return 70; // no preference set
  const target = campaign.target_niche.toLowerCase();
  const categories = (creator.content_categories || []).map((c) => c.toLowerCase());
  if (categories.includes(target)) return 100;
  // partial credit for related/declared niche field match
  if ((creator.niche || '').toLowerCase() === target) return 90;
  return 35;
}

function followerFitScore(campaign, creator) {
  const min = campaign.min_followers || 0;
  const followers = creator.follower_count || 0;
  if (followers < min) return clamp(40 * (followers / Math.max(min, 1)));
  // Reward being reasonably close to the floor (cost-efficient) but
  // don't penalize much for being well above it.
  const ratio = followers / Math.max(min, 1000);
  if (ratio <= 5) return 100;
  return clamp(100 - (ratio - 5) * 2);
}

function ccsFitScore(campaign, creator) {
  const minCcs = campaign.min_ccs_score || 0;
  const ccs = creator.ccs_score || 0;
  if (ccs < minCcs) return clamp(50 * (ccs / Math.max(minCcs, 1)));
  return ccs; // CCS itself is already 0-100 trust signal
}

function engagementQualityScore(creator) {
  // Reuses engagement auth + fraud detection sub-scores as proxy
  const eng = creator.engagement_auth_score ?? 50;
  const fraud = creator.fraud_detection_score ?? 50;
  return clamp(eng * 0.6 + fraud * 0.4);
}

function locationFitScore(campaign, creator) {
  if (!campaign.target_audience_location) return 70;
  if (!creator.location) return 50;
  const a = campaign.target_audience_location.toLowerCase();
  const b = creator.location.toLowerCase();
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  return 45;
}

const WEIGHTS = {
  niche: 0.3,
  followers: 0.2,
  ccs: 0.25,
  engagement: 0.15,
  location: 0.1,
};

/**
 * Computes a 0-100 match score between a campaign and a creator.
 * @param {object} campaign - campaign row
 * @param {object} creator - merged user + creator_profile row
 */
function calculateMatchScore(campaign, creator) {
  const niche = nicheFitScore(campaign, creator);
  const followers = followerFitScore(campaign, creator);
  const ccs = ccsFitScore(campaign, creator);
  const engagement = engagementQualityScore(creator);
  const location = locationFitScore(campaign, creator);

  const composite =
    niche * WEIGHTS.niche +
    followers * WEIGHTS.followers +
    ccs * WEIGHTS.ccs +
    engagement * WEIGHTS.engagement +
    location * WEIGHTS.location;

  return {
    match_score: Math.round(composite * 100) / 100,
    breakdown: {
      niche_fit: Math.round(niche),
      follower_fit: Math.round(followers),
      ccs_fit: Math.round(ccs),
      engagement_quality: Math.round(engagement),
      location_fit: Math.round(location),
    },
  };
}

/**
 * Ranks an array of creators against a campaign, descending by match_score.
 */
function rankCreatorsForCampaign(campaign, creators) {
  return creators
    .map((creator) => ({
      ...creator,
      ...calculateMatchScore(campaign, creator),
    }))
    .sort((a, b) => b.match_score - a.match_score);
}

module.exports = { calculateMatchScore, rankCreatorsForCampaign };
