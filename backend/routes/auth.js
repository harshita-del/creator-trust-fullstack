// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

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
// POST /api/auth/signup
// ───────────────────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty(),
    body('role').isIn(['brand', 'creator']),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const { email, password, full_name, role, company_name } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const password_hash = await bcrypt.hash(password, 12);

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, full_name, company_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, full_name, company_name, created_at`,
        [email, password_hash, role, full_name, role === 'brand' ? company_name : null]
      );
      const user = userResult.rows[0];

      if (role === 'creator') {
        await client.query('INSERT INTO creator_profiles (user_id) VALUES ($1)', [user.id]);
      } else if (role === 'brand') {
        await client.query('INSERT INTO brand_profiles (user_id) VALUES ($1)', [user.id]);
      }

      await client.query('COMMIT');

      const token = signToken({ id: user.id, role: user.role });
      res.status(201).json({ user, token });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    } finally {
      client.release();
    }
  }
);

// ───────────────────────────────────────────────────────────
// POST /api/auth/login
// ───────────────────────────────────────────────────────────
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    const { email, password } = req.body;

    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signToken({ id: user.id, role: user.role });
      delete user.password_hash;

      res.json({ user, token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  }
);

// ───────────────────────────────────────────────────────────
// GET /api/auth/me
// ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
