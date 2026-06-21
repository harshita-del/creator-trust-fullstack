// routes/stats.js
const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ───────────────────────────────────────────────────────────
// GET /api/stats/platform — public, powers landing page ticker
// ───────────────────────────────────────────────────────────
router.get('/platform', async (req, res) => {
  try {
    const [creators, brands, campaigns, escrowed] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'creator'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'brand'"),
      pool.query("SELECT COUNT(*) FROM campaigns"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status IN ('held_in_escrow','released')"),
    ]);

    res.json({
      total_creators: Number(creators.rows[0].count),
      total_brands: Number(brands.rows[0].count),
      total_campaigns: Number(campaigns.rows[0].count),
      total_escrowed_volume: Number(escrowed.rows[0].total),
    });
  } catch (err) {
    console.error('Platform stats error:', err);
    res.status(500).json({ error: 'Failed to fetch platform stats.' });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/stats/dashboard — role-aware summary for logged-in user
// ───────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'brand') {
      const [campaigns, activeCollabs, spend] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM campaigns WHERE brand_id = $1', [req.user.id]),
        pool.query(
          "SELECT COUNT(*) FROM collaborations WHERE brand_id = $1 AND status NOT IN ('completed','cancelled')",
          [req.user.id]
        ),
        pool.query('SELECT total_spend FROM brand_profiles WHERE user_id = $1', [req.user.id]),
      ]);
      return res.json({
        role: 'brand',
        total_campaigns: Number(campaigns.rows[0].count),
        active_collaborations: Number(activeCollabs.rows[0].count),
        total_spend: Number(spend.rows[0]?.total_spend || 0),
      });
    }

    if (req.user.role === 'creator') {
      const [profile, applications, activeCollabs] = await Promise.all([
        pool.query('SELECT ccs_score, ccs_tier FROM creator_profiles WHERE user_id = $1', [req.user.id]),
        pool.query('SELECT COUNT(*) FROM applications WHERE creator_id = $1', [req.user.id]),
        pool.query(
          "SELECT COUNT(*) FROM collaborations WHERE creator_id = $1 AND status NOT IN ('completed','cancelled')",
          [req.user.id]
        ),
      ]);
      return res.json({
        role: 'creator',
        ccs_score: Number(profile.rows[0]?.ccs_score || 0),
        ccs_tier: profile.rows[0]?.ccs_tier || 'Fair',
        total_applications: Number(applications.rows[0].count),
        active_collaborations: Number(activeCollabs.rows[0].count),
      });
    }

    res.json({ role: req.user.role });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

module.exports = router;
