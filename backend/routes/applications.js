// routes/applications.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculateMatchScore } = require('../utils/matchingEngine');

const router = express.Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', details: errors.array() });
    return false;
  }
  return true;
}

// ───────────────────────────────────────────────────────────
// POST /api/applications — creator applies to a campaign
// ───────────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  requireRole('creator'),
  [body('campaign_id').isUUID(), body('pitch_message').optional().isString()],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { campaign_id, pitch_message } = req.body;

    try {
      const campaignRes = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaign_id]);
      if (campaignRes.rows.length === 0) {
        return res.status(404).json({ error: 'Campaign not found.' });
      }
      const campaign = campaignRes.rows[0];

      const creatorRes = await pool.query(
        `SELECT u.id, cp.* FROM users u JOIN creator_profiles cp ON cp.user_id = u.id WHERE u.id = $1`,
        [req.user.id]
      );
      const creator = creatorRes.rows[0];
      const { match_score } = calculateMatchScore(campaign, creator);

      const { rows } = await pool.query(
        `INSERT INTO applications (campaign_id, creator_id, match_score, pitch_message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [campaign_id, req.user.id, match_score, pitch_message || null]
      );
      res.status(201).json({ application: rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this campaign.' });
      }
      console.error('Create application error:', err);
      res.status(500).json({ error: 'Failed to submit application.' });
    }
  }
);

// ───────────────────────────────────────────────────────────
// GET /api/applications/mine — creator's own applications
// ───────────────────────────────────────────────────────────
router.get('/mine', requireAuth, requireRole('creator'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, c.title AS campaign_title, c.budget, c.status AS campaign_status
     FROM applications a JOIN campaigns c ON c.id = a.campaign_id
     WHERE a.creator_id = $1 ORDER BY a.created_at DESC`,
    [req.user.id]
  );
  res.json({ applications: rows });
});

// ───────────────────────────────────────────────────────────
// GET /api/applications/campaign/:campaignId — brand reviews applicants
// ───────────────────────────────────────────────────────────
router.get('/campaign/:campaignId', requireAuth, requireRole('brand'), async (req, res) => {
  const ownsCampaign = await pool.query(
    'SELECT id FROM campaigns WHERE id = $1 AND brand_id = $2',
    [req.params.campaignId, req.user.id]
  );
  if (ownsCampaign.rows.length === 0) return res.status(404).json({ error: 'Campaign not found.' });

  const { rows } = await pool.query(
    `SELECT a.*, u.full_name, u.avatar_url, cp.ccs_score, cp.ccs_tier, cp.follower_count, cp.niche
     FROM applications a
     JOIN users u ON u.id = a.creator_id
     JOIN creator_profiles cp ON cp.user_id = a.creator_id
     WHERE a.campaign_id = $1
     ORDER BY a.match_score DESC`,
    [req.params.campaignId]
  );
  res.json({ applications: rows });
});

// ───────────────────────────────────────────────────────────
// PATCH /api/applications/:id/status — brand shortlists/accepts/rejects
// ───────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('brand'),
  [body('status').isIn(['shortlisted', 'accepted', 'rejected'])],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const appRes = await client.query(
        `SELECT a.*, c.brand_id, c.budget FROM applications a
         JOIN campaigns c ON c.id = a.campaign_id
         WHERE a.id = $1`,
        [req.params.id]
      );
      if (appRes.rows.length === 0 || appRes.rows[0].brand_id !== req.user.id) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Application not found.' });
      }
      const application = appRes.rows[0];

      const updated = await client.query(
        `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [req.body.status, req.params.id]
      );

      let collaboration = null;
      if (req.body.status === 'accepted') {
        const collabRes = await client.query(
          `INSERT INTO collaborations (campaign_id, application_id, brand_id, creator_id, agreed_amount)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [application.campaign_id, application.id, application.brand_id, application.creator_id, application.budget]
        );
        collaboration = collabRes.rows[0];

        await client.query(
          `UPDATE campaigns SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
          [application.campaign_id]
        );
      }

      await client.query('COMMIT');
      res.json({ application: updated.rows[0], collaboration });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Update application status error:', err);
      res.status(500).json({ error: 'Failed to update application.' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
