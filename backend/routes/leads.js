// routes/leads.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const router = express.Router();

// ───────────────────────────────────────────────────────────
// POST /api/leads — public, no auth (landing page CTA form)
// ───────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').optional().isString().trim(),
    body('role_interest').optional().isIn(['brand', 'creator']),
    body('message').optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, name, role_interest, message } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO leads (email, name, role_interest, message)
         VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
        [email, name || null, role_interest || null, message || null]
      );
      res.status(201).json({ success: true, lead: rows[0] });
    } catch (err) {
      console.error('Create lead error:', err);
      res.status(500).json({ error: 'Failed to submit. Please try again.' });
    }
  }
);

module.exports = router;
