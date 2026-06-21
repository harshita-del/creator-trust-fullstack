// src/pages/Landing/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import Hero from '../../components/Hero/Hero';
import Button from '../../components/Buttons/Button';
import './Landing.css';

const FEATURES = [
  {
    icon: '◆',
    title: 'Creator Credit Score (CCS)',
    desc: 'A single 0–100 trust number computed from five audited factors, recalculated after every collaboration — the same way a credit bureau scores financial trust.',
    tag: 'Core',
  },
  {
    icon: '✶',
    title: 'AI Brand–Creator Matching',
    desc: 'Campaigns are ranked against creators on niche fit, follower range, CCS threshold, engagement quality, and location — not follower count alone.',
    tag: 'AI',
  },
  {
    icon: '◈',
    title: 'Escrow Payments',
    desc: 'Brand funds are held in escrow the moment a collaboration starts and only released once the deliverable is verified — no chasing invoices.',
    tag: 'Payments',
  },
  {
    icon: '✓',
    title: 'Content Verification',
    desc: 'Creators submit a deliverable link; brands review and verify before funds move. Every step is timestamped on the collaboration record.',
    tag: 'Trust',
  },
  {
    icon: '⚠',
    title: 'Fraud & Fake-Follower Detection',
    desc: 'Engagement rate is checked against what\u2019s statistically normal for the account size — abnormally low OR suspiciously high both get flagged.',
    tag: 'Safety',
  },
  {
    icon: '▤',
    title: 'Creator Analytics',
    desc: 'Engagement trends, CCS history over time, and campaign performance — so creators can see exactly what\u2019s moving their score.',
    tag: 'Insight',
  },
];

const HOW_STEPS = [
  { n: '01', title: 'Build your ledger', desc: 'Creators connect their handles and stats; CCS is calculated instantly from real signals.' },
  { n: '02', title: 'Get matched', desc: 'Brands post a campaign; the matching engine ranks creators by true compatibility, not vanity metrics.' },
  { n: '03', title: 'Work, verify, get paid', desc: 'Funds sit in escrow until the brand verifies the deliverable — then release automatically.' },
];

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />

      <section className="section" id="how">
        <div className="container">
          <div className="eyebrow">THE FLOW</div>
          <h2 className="section-title">From sign-up to settled payment, in three steps</h2>
          <div className="how-grid">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="how-step">
                <div className="how-step__num text-mono">{s.n}</div>
                <h4 className="how-step__title">{s.title}</h4>
                <p className="how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features" style={{ background: 'var(--ink-soft)' }}>
        <div className="container">
          <div className="eyebrow">WHAT'S IN THE LEDGER</div>
          <h2 className="section-title">Six systems, one trust layer</h2>
          <p className="section-sub">Each one closes a specific gap in how brands and creators currently work together.</p>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__top">
                  <span className="feature-card__icon">{f.icon}</span>
                  <span className="feature-card__tag text-mono">{f.tag}</span>
                </div>
                <h4 className="feature-card__title">{f.title}</h4>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="ccs">
        <div className="container ccs-explainer">
          <div>
            <div className="eyebrow">THE CORE INSTRUMENT</div>
            <h2 className="section-title">CCS isn't a vanity badge — it's audited</h2>
            <p className="section-sub" style={{ marginBottom: 28 }}>
              Five weighted factors feed the score. None of them are self-reported without
              cross-checks: engagement is measured against what's statistically normal for
              the account's size, and campaign history only improves the score after a brand
              confirms the work was actually delivered.
            </p>
            <ul className="ccs-weights">
              <li><span>Audience Quality</span><strong>25%</strong></li>
              <li><span>Engagement Authenticity</span><strong>25%</strong></li>
              <li><span>Campaign History</span><strong>20%</strong></li>
              <li><span>Fraud Detection</span><strong>20%</strong></li>
              <li><span>Brand Reliability Feedback</span><strong>10%</strong></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container cta-inner">
          <h2 className="section-title" style={{ margin: '0 auto', textAlign: 'center' }}>
            Your trust score is waiting to be calculated.
          </h2>
          <p className="section-sub" style={{ margin: '14px auto 32px', textAlign: 'center' }}>
            Takes under two minutes — no credit card, no follower-buying detector lies.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button as={Link} to="/login?mode=signup&role=creator" size="lg" variant="primary">Join as a creator</Button>
            <Button as={Link} to="/login?mode=signup&role=brand" size="lg" variant="outline">Join as a brand</Button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
