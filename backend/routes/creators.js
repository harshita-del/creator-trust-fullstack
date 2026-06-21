// routes/creators.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recalculateCCS } = require('../utils/ccsService');

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
// GET /api/creators/me — full profile incl. CCS breakdown
// ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, requireRole('creator'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM creator_profiles WHERE user_id = $1',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Creator profile not found.' });
  res.json({ profile: rows[0] });
});

// ───────────────────────────────────────────────────────────
// PUT /api/creators/me — update profile, then recalc CCS
// ───────────────────────────────────────────────────────────
router.put(
  '/me',
  requireAuth,
  requireRole('creator'),
  [
    body('niche').optional().isString(),
    body('bio').optional().isString(),
    body('follower_count').optional().isInt({ min: 0 }),
    body('avg_engagement_rate').optional().isFloat({ min: 0, max: 100 }),
    body('fake_follower_pct').optional().isFloat({ min: 0, max: 100 }),
    body('content_categories').optional().isArray(),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const fields = [
      'niche', 'bio', 'instagram_handle', 'youtube_handle', 'tiktok_handle',
      'follower_count', 'avg_engagement_rate', 'fake_follower_pct',
      'location', 'content_categories',
    ];
    const updates = [];
    const values = [];
    let idx = 1;

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(req.body[f]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      values.push(req.user.id);
      await client.query(
        `UPDATE creator_profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
        values
      );

      const ccsResult = await recalculateCCS(client, req.user.id, 'Profile data updated');
      await client.query('COMMIT');

      const { rows } = await pool.query('SELECT * FROM creator_profiles WHERE user_id = $1', [req.user.id]);
      res.json({ profile: rows[0], ccs: ccsResult });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Update creator profile error:', err);
      res.status(500).json({ error: 'Failed to update profile.' });
    } finally {
      client.release();
    }
  }
);

// ───────────────────────────────────────────────────────────
// POST /api/creators/me/recalculate-ccs — manual trigger
// ───────────────────────────────────────────────────────────
router.post('/me/recalculate-ccs', requireAuth, requireRole('creator'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await recalculateCCS(client, req.user.id, 'Manual recalculation');
    await client.query('COMMIT');
    res.json({ ccs: result });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Recalculate CCS error:', err);
    res.status(500).json({ error: 'Failed to recalculate CCS.' });
  } finally {
    client.release();
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/creators/:id — public profile view (for brands)
// ───────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.avatar_url, cp.*
     FROM users u JOIN creator_profiles cp ON cp.user_id = u.id
     WHERE u.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Creator not found.' });
  res.json({ creator: rows[0] });
});

// ───────────────────────────────────────────────────────────
// GET /api/creators — browse/search creators (for brands)
// ───────────────────────────────────────────────────────────
router.get('/', requireAuth, requireRole('brand', 'admin'), async (req, res) => {
  const { niche, min_ccs, min_followers, sort = 'ccs_score' } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (niche) {
    conditions.push(`cp.niche ILIKE $${idx++}`);
    values.push(`%${niche}%`);
  }
  if (min_ccs) {
    conditions.push(`cp.ccs_score >= $${idx++}`);
    values.push(Number(min_ccs));
  }
  if (min_followers) {
    conditions.push(`cp.follower_count >= $${idx++}`);
    values.push(Number(min_followers));
  }

  const allowedSorts = ['ccs_score', 'follower_count', 'avg_engagement_rate'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'ccs_score';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.avatar_url, cp.*
     FROM users u JOIN creator_profiles cp ON cp.user_id = u.id
     ${where}
     ORDER BY cp.${sortCol} DESC
     LIMIT 50`,
    values
  );

  res.json({ creators: rows, count: rows.length });
});

module.exports = router;
