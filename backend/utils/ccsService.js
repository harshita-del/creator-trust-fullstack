// utils/ccsService.js
// Shared DB-aware CCS recalculation service, used by both the
// creators routes and the collaborations routes (avoids circular
// requires between route files).
const { calculateCCS } = require('./ccsEngine');

/**
 * Gathers signals for a creator, recalculates CCS, persists it,
 * and writes a history row. Must be called with an active pg client
 * (so it can participate in an existing transaction).
 */
async function recalculateCCS(client, creatorUserId, reason = 'Profile update') {
  const profileRes = await client.query(
    'SELECT * FROM creator_profiles WHERE user_id = $1',
    [creatorUserId]
  );
  if (profileRes.rows.length === 0) return null;
  const profile = profileRes.rows[0];

  const collabStats = await client.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
       COUNT(*) AS total_count,
       AVG(brand_rating) AS avg_rating
     FROM collaborations WHERE creator_id = $1`,
    [creatorUserId]
  );
  const { completed_count, total_count, avg_rating } = collabStats.rows[0];

  const disputeRes = await client.query(
    `SELECT COUNT(*) AS dispute_count FROM collaborations
     WHERE creator_id = $1 AND status = 'disputed'`,
    [creatorUserId]
  );

  const signals = {
    follower_count: profile.follower_count,
    fake_follower_pct: profile.fake_follower_pct,
    avg_engagement_rate: profile.avg_engagement_rate,
    completedCount: Number(completed_count),
    totalCount: Number(total_count),
    avgRating: avg_rating ? Number(avg_rating) : null,
    disputeCount: Number(disputeRes.rows[0].dispute_count),
    avgCreatorProfessionalismRating: avg_rating ? Number(avg_rating) : null,
  };

  const result = calculateCCS(signals);

  await client.query(
    `UPDATE creator_profiles SET
       audience_quality_score = $1, engagement_auth_score = $2,
       campaign_history_score = $3, fraud_detection_score = $4,
       brand_reliability_score = $5, ccs_score = $6, ccs_tier = $7,
       ccs_last_calculated = NOW(), updated_at = NOW()
     WHERE user_id = $8`,
    [
      result.audience_quality_score,
      result.engagement_auth_score,
      result.campaign_history_score,
      result.fraud_detection_score,
      result.brand_reliability_score,
      result.ccs_score,
      result.ccs_tier,
      creatorUserId,
    ]
  );

  await client.query(
    'INSERT INTO ccs_score_history (creator_id, ccs_score, reason) VALUES ($1, $2, $3)',
    [creatorUserId, result.ccs_score, reason]
  );

  return result;
}

module.exports = { recalculateCCS };
