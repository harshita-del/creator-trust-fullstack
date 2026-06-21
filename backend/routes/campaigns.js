// routes/campaigns.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rankCreatorsForCampaign } = require('../utils/matchingEngine');

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
// POST /api/campaigns — brand creates a campaign
// ───────────────────────────────────────────────────────────
router.post(
  '/',
  requireAuth,
  requireRole('brand'),
  [
    body('title').trim().notEmpty(),
    body('budget').isFloat({ min: 0 }),
    body('content_type').optional().isString(),
    body('target_niche').optional().isString(),
    body('min_followers').optional().isInt({ min: 0 }),
    body('min_ccs_score').optional().isFloat({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const {
      title, description, content_type, target_niche,
      target_audience_age, target_audience_location,
      min_followers, min_ccs_score, budget, timeline_days,
    } = req.body;

    try {
      const { rows } = await pool.query(
        `INSERT INTO campaigns
           (brand_id, title, description, content_type, target_niche,
            target_audience_age, target_audience_location, min_followers,
            min_ccs_score, budget, timeline_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          req.user.id, title, description, content_type, target_niche,
          target_audience_age, target_audience_location, min_followers || 0,
          min_ccs_score || 0, budget, timeline_days || 14,
        ]
      );
      res.status(201).json({ campaign: rows[0] });
    } catch (err) {
      console.error('Create campaign error:', err);
      res.status(500).json({ error: 'Failed to create campaign.' });
    }
  }
);

// ───────────────────────────────────────────────────────────
// GET /api/campaigns — list (creators see open campaigns, brands see own)
// ───────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    let query, values;
    if (req.user.role === 'brand') {
      query = 'SELECT * FROM campaigns WHERE brand_id = $1 ORDER BY created_at DESC';
      values = [req.user.id];
    } else {
      query = "SELECT * FROM campaigns WHERE status = 'open' ORDER BY created_at DESC LIMIT 50";
      values = [];
    }
    const { rows } = await pool.query(query, values);
    res.json({ campaigns: rows, count: rows.length });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns.' });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/campaigns/:id
// ───────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Campaign not found.' });
  res.json({ campaign: rows[0] });
});

// ───────────────────────────────────────────────────────────
// GET /api/campaigns/:id/matches — AI-ranked creator shortlist
// ───────────────────────────────────────────────────────────
router.get('/:id/matches', requireAuth, requireRole('brand'), async (req, res) => {
  try {
    const campaignRes = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1 AND brand_id = $2',
      [req.params.id, req.user.id]
    );
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaign = campaignRes.rows[0];

    const creatorsRes = await pool.query(
      `SELECT u.id, u.full_name, u.avatar_url, cp.*
       FROM users u JOIN creator_profiles cp ON cp.user_id = u.id`
    );

    const ranked = rankCreatorsForCampaign(campaign, creatorsRes.rows).slice(0, 20);

    res.json({ campaign_id: campaign.id, matches: ranked, count: ranked.length });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ error: 'Failed to compute matches.' });
  }
});

// ───────────────────────────────────────────────────────────
// PATCH /api/campaigns/:id/status — brand updates campaign status
// ───────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('brand'),
  [body('status').isIn(['open', 'matching', 'in_progress', 'verification', 'completed', 'cancelled'])],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { rows } = await pool.query(
      `UPDATE campaigns SET status = $1, updated_at = NOW()
       WHERE id = $2 AND brand_id = $3 RETURNING *`,
      [req.body.status, req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Campaign not found.' });
    res.json({ campaign: rows[0] });
  }
);

module.exports = router;
