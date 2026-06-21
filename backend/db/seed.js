// db/seed.js — populates demo data so the platform looks alive immediately
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { recalculateCCS } = require('../utils/ccsService');

const DEMO_PASSWORD = 'Password123!';

const creatorsData = [
  { full_name: 'Aisha Khan', email: 'aisha.creator@example.com', niche: 'Fashion', follower_count: 185000, avg_engagement_rate: 4.2, fake_follower_pct: 3.1, location: 'Mumbai', content_categories: ['fashion', 'lifestyle'] },
  { full_name: 'Rohit Verma', email: 'rohit.creator@example.com', niche: 'Tech', follower_count: 52000, avg_engagement_rate: 6.8, fake_follower_pct: 1.5, location: 'Bengaluru', content_categories: ['tech', 'gadgets'] },
  { full_name: 'Sara Iyer', email: 'sara.creator@example.com', niche: 'Fitness', follower_count: 410000, avg_engagement_rate: 2.1, fake_follower_pct: 12.4, location: 'Delhi', content_categories: ['fitness', 'health'] },
  { full_name: 'Dev Malhotra', email: 'dev.creator@example.com', niche: 'Food', follower_count: 9800, avg_engagement_rate: 8.9, fake_follower_pct: 0.8, location: 'Pune', content_categories: ['food', 'travel'] },
  { full_name: 'Priya Nair', email: 'priya.creator@example.com', niche: 'Beauty', follower_count: 720000, avg_engagement_rate: 1.4, fake_follower_pct: 22.7, location: 'Chennai', content_categories: ['beauty', 'fashion'] },
];

const brandsData = [
  { full_name: 'Meera Shah', email: 'meera.brand@example.com', company_name: 'Lumina Cosmetics', industry: 'Beauty', website: 'https://luminacosmetics.example.com' },
  { full_name: 'Arjun Patel', email: 'arjun.brand@example.com', company_name: 'Bytewise Electronics', industry: 'Tech', website: 'https://bytewise.example.com' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding demo data...');
    const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // ── Creators ──
    const creatorIds = [];
    for (const c of creatorsData) {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [c.email]);
      if (existing.rows.length > 0) {
        console.log(`  ↺ Skipping existing creator ${c.email}`);
        creatorIds.push(existing.rows[0].id);
        await client.query('ROLLBACK');
        continue;
      }

      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, full_name, is_verified)
         VALUES ($1, $2, 'creator', $3, true) RETURNING id`,
        [c.email, password_hash, c.full_name]
      );
      const userId = userRes.rows[0].id;
      creatorIds.push(userId);

      await client.query(
        `INSERT INTO creator_profiles
           (user_id, niche, follower_count, avg_engagement_rate, fake_follower_pct, location, content_categories)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, c.niche, c.follower_count, c.avg_engagement_rate, c.fake_follower_pct, c.location, c.content_categories]
      );

      await recalculateCCS(client, userId, 'Initial seed');
      await client.query('COMMIT');
      console.log(`  ✓ Created creator: ${c.full_name} (${c.email})`);
    }

    // ── Brands ──
    const brandIds = [];
    for (const b of brandsData) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [b.email]);
      if (existing.rows.length > 0) {
        console.log(`  ↺ Skipping existing brand ${b.email}`);
        brandIds.push(existing.rows[0].id);
        continue;
      }

      const userRes = await pool.query(
        `INSERT INTO users (email, password_hash, role, full_name, company_name, is_verified)
         VALUES ($1, $2, 'brand', $3, $4, true) RETURNING id`,
        [b.email, password_hash, b.full_name, b.company_name]
      );
      const userId = userRes.rows[0].id;
      brandIds.push(userId);

      await pool.query(
        `INSERT INTO brand_profiles (user_id, industry, website) VALUES ($1, $2, $3)`,
        [userId, b.industry, b.website]
      );
      console.log(`  ✓ Created brand: ${b.company_name} (${b.email})`);
    }

    // ── Sample campaigns ──
    if (brandIds.length > 0) {
      const campaignsExist = await pool.query('SELECT COUNT(*) FROM campaigns');
      if (Number(campaignsExist.rows[0].count) === 0) {
        await pool.query(
          `INSERT INTO campaigns
             (brand_id, title, description, content_type, target_niche, target_audience_location,
              min_followers, min_ccs_score, budget, timeline_days, status)
           VALUES
             ($1, 'Summer Skincare Launch', 'Promote our new SPF moisturizer line via Reels.', 'reel', 'beauty', 'Mumbai', 50000, 60, 25000, 14, 'open'),
             ($2, 'Smartwatch Review Campaign', 'Honest unboxing + review video of our new smartwatch.', 'video', 'tech', 'Bengaluru', 20000, 65, 18000, 21, 'open')`,
          [brandIds[0], brandIds[1] || brandIds[0]]
        );
        console.log('  ✓ Created sample campaigns');
      }
    }

    console.log('\n✅ Seed complete!');
    console.log(`   Demo password for all seeded accounts: ${DEMO_PASSWORD}`);
    console.log('   Try logging in as: aisha.creator@example.com or meera.brand@example.com');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    try { await client.query('ROLLBACK'); } catch (_) {}
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
