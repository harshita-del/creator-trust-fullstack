-- ═══════════════════════════════════════════════════════════
-- ASLICONNECT — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- USERS (shared table for brands + creators, role-based)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('brand', 'creator', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),                 -- brands only
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- CREATOR PROFILES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche VARCHAR(100),
  bio TEXT,
  instagram_handle VARCHAR(100),
  youtube_handle VARCHAR(100),
  tiktok_handle VARCHAR(100),
  follower_count INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2) DEFAULT 0,   -- percentage
  fake_follower_pct NUMERIC(5,2) DEFAULT 0,     -- estimated, lower = better
  location VARCHAR(120),
  content_categories TEXT[],                    -- e.g. {fashion,tech,fitness}

  -- CCS sub-scores (0-100 each), recomputed by scoring engine
  audience_quality_score NUMERIC(5,2) DEFAULT 50,
  engagement_auth_score NUMERIC(5,2) DEFAULT 50,
  campaign_history_score NUMERIC(5,2) DEFAULT 50,
  fraud_detection_score NUMERIC(5,2) DEFAULT 50,  -- higher = lower fraud risk
  brand_reliability_score NUMERIC(5,2) DEFAULT 50,

  ccs_score NUMERIC(5,2) DEFAULT 50,             -- weighted composite, 0-100
  ccs_tier VARCHAR(20) DEFAULT 'Fair',           -- Risky/Fair/Good/Trusted
  ccs_last_calculated TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- BRAND PROFILES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  industry VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  reliability_score NUMERIC(5,2) DEFAULT 50,    -- payment promptness etc.
  total_campaigns INTEGER DEFAULT 0,
  total_spend NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50),                -- reel, post, video, story...
  target_niche VARCHAR(100),
  target_audience_age VARCHAR(50),
  target_audience_location VARCHAR(120),
  min_followers INTEGER DEFAULT 0,
  min_ccs_score NUMERIC(5,2) DEFAULT 0,
  budget NUMERIC(12,2) NOT NULL,
  timeline_days INTEGER DEFAULT 14,
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','matching','in_progress','verification','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- APPLICATIONS / MATCHES (creator <-> campaign)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2),                -- AI compatibility score 0-100
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')),
  pitch_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- ───────────────────────────────────────────────────────────
-- COLLABORATIONS (accepted application -> active engagement)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES users(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  agreed_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active','content_submitted','verified','completed','disputed','cancelled')),
  deliverable_url TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  brand_rating SMALLINT CHECK (brand_rating BETWEEN 1 AND 5),
  creator_rating SMALLINT CHECK (creator_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- ESCROW PAYMENTS (Razorpay-backed)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','held_in_escrow','released','refunded','failed')),
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- CCS SCORE HISTORY (for "real-time recalculation" timeline)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ccs_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ccs_score NUMERIC(5,2) NOT NULL,
  reason VARCHAR(255),                      -- e.g. "Campaign completed", "Engagement audit"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- LEADS (landing page contact / waitlist form)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role_interest VARCHAR(20),                -- brand / creator
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_ccs ON creator_profiles(ccs_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_applications_campaign ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_creator ON applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_brand ON collaborations(brand_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_creator ON collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_payments_collab ON payments(collaboration_id);
