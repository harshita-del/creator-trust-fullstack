// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');


const authRoutes = require('./routes/auth');
const creatorRoutes = require('./routes/creators');
const campaignRoutes = require('./routes/campaigns');
const applicationRoutes = require('./routes/applications');
const collaborationRoutes = require('./routes/collaborations');
const paymentRoutes = require('./routes/payments');
const leadRoutes = require('./routes/leads');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & parsing middleware ──────────────────────────
app.use(helmet({ contentSecurityPolicy: false })) ; // CSP off so the bundled landing page's inline styles/scripts still render
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── API routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'asliconnect-backend', time: new Date().toISOString() });
});


// // // ─── Serve frontend (static landing page + dashboards) ───────
// >>>>>>> 168d75d (Prepare backend for Render)
// const frontendDir = path.join(__dirname, '..', 'frontend');
// app.use(express.static(frontendDir));

// app.get('*', (req, res, next) => {
//   if (req.path.startsWith('/api/')) return next();
//   res.sendFile(path.join(frontendDir, 'index.html'));
// });

// ─── 404 + error handlers ─────────────────────────────────────
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 ASLICONNECT backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;