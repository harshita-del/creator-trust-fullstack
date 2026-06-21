// src/components/CreatorCard/CreatorCard.jsx
import React from 'react';
import { ccsColorVar } from '../../utils/ccs';
import './CreatorCard.css';

export default function CreatorCard({ creator, matchScore, breakdown, onAction, actionLabel }) {
  const color = ccsColorVar(Number(creator.ccs_score || 0));

  return (
    <div className="creator-card">
      <div className="creator-card__top">
        <div className="creator-card__avatar">{initials(creator.full_name)}</div>
        <div style={{ flex: 1 }}>
          <div className="creator-card__name">{creator.full_name}</div>
          <div className="creator-card__meta">{creator.niche || 'General'} · {formatFollowers(creator.follower_count)} followers</div>
        </div>
        {matchScore !== undefined && (
          <div className="creator-card__match">
            <div className="creator-card__match-val">{matchScore}%</div>
            <div className="creator-card__match-label text-mono">MATCH</div>
          </div>
        )}
      </div>

      <div className="creator-card__ccs">
        <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>CCS</span>
        <span className="creator-card__ccs-val" style={{ color }}>{Number(creator.ccs_score || 0).toFixed(1)}</span>
        <span className="creator-card__ccs-tier" style={{ color }}>{creator.ccs_tier}</span>
      </div>

      {breakdown && (
        <div className="creator-card__breakdown">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="creator-card__chip" title={key.replace(/_/g, ' ')}>
              {key.replace('_fit', '').replace('_quality', '').replace(/_/g, ' ')}: {val}
            </div>
          ))}
        </div>
      )}

      {onAction && (
        <button className="creator-card__action" onClick={onAction}>
          {actionLabel || 'View profile'}
        </button>
      )}
    </div>
  );
}

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function formatFollowers(n) {
  n = Number(n || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
