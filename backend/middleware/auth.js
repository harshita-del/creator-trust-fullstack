// middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const pool = require('../db/pool');

/**
 * requireAuth — verifies the Bearer JWT and attaches req.user
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
    }

    const decoded = verifyToken(token);

    const { rows } = await pool.query(
      'SELECT id, email, role, full_name, company_name, is_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * requireRole(...roles) — guards routes to specific user roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
