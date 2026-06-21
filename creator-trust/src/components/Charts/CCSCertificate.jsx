// src/components/Charts/CCSCertificate.jsx
// ═══════════════════════════════════════════════════════════
// THE SIGNATURE ELEMENT of the whole product.
// Renders a Creator Credit Score as a "credit report stamp" —
// not a generic circular SaaS gauge. Includes the animated
// stamp-in number, a ledger-style factor breakdown, and an
// optional history sparkline.
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { ccsTier, ccsColorVar, CCS_FACTORS } from '../../utils/ccs';
import './CCSCertificate.css';

export default function CCSCertificate({ profile, animate = true, compact = false }) {
  const [stamped, setStamped] = useState(!animate);
  const [displayScore, setDisplayScore] = useState(animate ? 0 : profile?.ccs_score || 0);
  const ref = useRef(null);

  const score = Number(profile?.ccs_score ?? 0);
  const tier = profile?.ccs_tier || ccsTier(score);
  const color = ccsColorVar(score);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setStamped(true), 120);

    let frame;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [score, animate]);

  return (
    <div className={`ccs-cert ${compact ? 'ccs-cert--compact' : ''} ${stamped ? 'ccs-cert--stamped' : ''}`} ref={ref}>
      <div className="ccs-cert__header">
        <div>
          <div className="ccs-cert__eyebrow text-mono">CREATOR CREDIT SCORE</div>
          <div className="ccs-cert__id text-mono muted">CERT NO. {certId(profile)}</div>
        </div>
        <div className="ccs-cert__seal" style={{ '--seal-color': color }}>
          <span>{tier}</span>
        </div>
      </div>

      <div className="hr-ledger" style={{ margin: '18px 0' }} />

      <div className="ccs-cert__score-row">
        <div className="ccs-cert__score" style={{ color }}>
          {displayScore.toFixed(1)}
          <span className="ccs-cert__max">/100</span>
        </div>
        <div className="ccs-cert__tier-label">
          <div className="muted text-mono" style={{ fontSize: 11 }}>TRUST TIER</div>
          <div style={{ color, fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600 }}>{tier}</div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="hr-ledger" style={{ margin: '20px 0 16px' }} />
          <div className="ccs-cert__factors">
            {CCS_FACTORS.map((f, i) => (
              <FactorLine key={f.key} factor={f} value={profile?.[f.key]} delay={i * 90} stamped={stamped} />
            ))}
          </div>
        </>
      )}

      <div className="ccs-cert__footer text-mono muted">
        Last recalculated: {formatDate(profile?.ccs_last_calculated)}
      </div>
    </div>
  );
}

function FactorLine({ factor, value, delay, stamped }) {
  const v = Number(value ?? 0);
  return (
    <div className="ccs-factor">
      <div className="ccs-factor__top">
        <span className="ccs-factor__label">{factor.label}</span>
        <span className="ccs-factor__value text-mono">{v.toFixed(0)}</span>
      </div>
      <div className="ccs-factor__track">
        <div
          className="ccs-factor__fill"
          style={{
            width: stamped ? `${v}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <div className="ccs-factor__hint">{factor.hint}</div>
    </div>
  );
}

function certId(profile) {
  if (!profile?.user_id && !profile?.id) return '— — — —';
  const raw = (profile.user_id || profile.id || '').toString().replace(/-/g, '');
  return raw.slice(0, 8).toUpperCase() || '00000000';
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}
