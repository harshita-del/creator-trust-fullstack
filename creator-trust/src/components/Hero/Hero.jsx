// src/components/Hero/Hero.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Buttons/Button';
import CCSCertificate from '../Charts/CCSCertificate';
import './Hero.css';

const DEMO_PROFILE = {
  user_id: 'demo-aisha-khan-0001',
  ccs_score: 88.4,
  ccs_tier: 'Trusted',
  audience_quality_score: 92,
  engagement_auth_score: 81,
  campaign_history_score: 90,
  fraud_detection_score: 95,
  brand_reliability_score: 84,
  ccs_last_calculated: new Date().toISOString(),
};

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="eyebrow">A CREDIT SCORE, BUT FOR CREATORS</div>
          <h1 className="hero__headline">
            Every creator has a number.<br />
            <span className="gold">Now brands can see it.</span>
          </h1>
          <p className="hero__sub">
            CreatorTrust replaces guesswork with a verified score — audience quality,
            engagement authenticity, campaign history, and fraud risk, audited and
            recalculated after every collaboration. Brands match with confidence.
            Creators get paid through escrow, not promises.
          </p>
          <div className="hero__cta">
            <Button as={Link} to="/login?mode=signup&role=brand" size="lg" variant="primary">
              Start as a brand
            </Button>
            <Button as={Link} to="/login?mode=signup&role=creator" size="lg" variant="outline">
              Check your CCS
            </Button>
          </div>
          <div className="hero__trust-row">
            <TrustStat value="92%" label="match acceptance rate" />
            <TrustStat value="₹2.4Cr+" label="held in escrow to date" />
            <TrustStat value="11.3%" label="avg. fake-follower detection" />
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__visual-label text-mono">LIVE EXAMPLE · @aisha_khan</div>
          <CCSCertificate profile={DEMO_PROFILE} />
        </div>
      </div>
    </section>
  );
}

function TrustStat({ value, label }) {
  return (
    <div className="hero__trust-stat">
      <div className="hero__trust-val">{value}</div>
      <div className="hero__trust-label">{label}</div>
    </div>
  );
}
