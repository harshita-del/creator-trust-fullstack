// routes/collaborations.js
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
// GET /api/collaborations/mine — role-aware listing
// ───────────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  const column = req.user.role === 'brand' ? 'brand_id' : 'creator_id';
  const { rows } = await pool.query(
    `SELECT col.*, c.title AS campaign_title
     FROM collaborations col JOIN campaigns c ON c.id = col.campaign_id
     WHERE col.${column} = $1 ORDER BY col.created_at DESC`,
    [req.user.id]
  );
  res.json({ collaborations: rows });
});

// ───────────────────────────────────────────────────────────
// GET /api/collaborations/:id
// ───────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM collaborations WHERE id = $1 AND (brand_id = $2 OR creator_id = $2)`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Collaboration not found.' });
  res.json({ collaboration: rows[0] });
});

// ───────────────────────────────────────────────────────────
// POST /api/collaborations/:id/submit — creator submits deliverable
// ───────────────────────────────────────────────────────────
router.post(
  '/:id/submit',
  requireAuth,
  requireRole('creator'),
  [body('deliverable_url').isURL()],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const { rows } = await pool.query(
      `UPDATE collaborations
       SET deliverable_url = $1, status = 'content_submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND creator_id = $3 RETURNING *`,
      [req.body.deliverable_url, req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Collaboration not found.' });
    res.json({ collaboration: rows[0] });
  }
);

// ───────────────────────────────────────────────────────────
// POST /api/collaborations/:id/verify — brand verifies deliverable
// (triggers escrow release — see payments.js)
// ───────────────────────────────────────────────────────────
router.post('/:id/verify', requireAuth, requireRole('brand'), async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE collaborations
     SET status = 'verified', verified_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND brand_id = $2 AND status = 'content_submitted'
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Collaboration not found or not ready for verification.' });
  }
  res.json({ collaboration: rows[0], next_step: 'Call POST /api/payments/:collaborationId/release to release escrow.' });
});

// ───────────────────────────────────────────────────────────
// POST /api/collaborations/:id/complete — final step + ratings + CCS recalc
// ───────────────────────────────────────────────────────────
router.post(
  '/:id/complete',
  requireAuth,
  [body('rating').isInt({ min: 1, max: 5 })],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const collabRes = await client.query(
        'SELECT * FROM collaborations WHERE id = $1 AND (brand_id = $2 OR creator_id = $2)',
        [req.params.id, req.user.id]
      );
      if (collabRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Collaboration not found.' });
      }
      const collab = collabRes.rows[0];
      const ratingField = req.user.role === 'brand' ? 'brand_rating' : 'creator_rating';

      const updated = await client.query(
        `UPDATE collaborations SET ${ratingField} = $1, status = 'completed',
         completed_at = COALESCE(completed_at, NOW()), updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [req.body.rating, req.params.id]
      );

      // Recalculate CCS for the creator now that history changed
      await recalculateCCS(client, collab.creator_id, 'Collaboration completed');

      await client.query('COMMIT');
      res.json({ collaboration: updated.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Complete collaboration error:', err);
      res.status(500).json({ error: 'Failed to complete collaboration.' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
