// src/components/CampaignCard/CampaignCard.jsx
import React from 'react';
import './CampaignCard.css';

const STATUS_LABEL = {
  open: 'Open',
  matching: 'Matching',
  in_progress: 'In progress',
  verification: 'Verification',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function CampaignCard({ campaign, onPrimary, primaryLabel, footer }) {
  return (
    <div className="campaign-card">
      <div className="campaign-card__top">
        <h4 className="campaign-card__title">{campaign.title}</h4>
        <span className={`campaign-card__status campaign-card__status--${campaign.status}`}>
          {STATUS_LABEL[campaign.status] || campaign.status}
        </span>
      </div>

      {campaign.description && <p className="campaign-card__desc">{truncate(campaign.description, 110)}</p>}

      <div className="campaign-card__meta">
        <MetaItem label="Budget" value={`₹${Number(campaign.budget).toLocaleString('en-IN')}`} />
        <MetaItem label="Niche" value={campaign.target_niche || 'Any'} />
        <MetaItem label="Min CCS" value={campaign.min_ccs_score} />
        <MetaItem label="Min followers" value={Number(campaign.min_followers || 0).toLocaleString()} />
      </div>

      {onPrimary && (
        <button className="campaign-card__btn" onClick={onPrimary}>{primaryLabel}</button>
      )}
      {footer}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="campaign-card__meta-item">
      <div className="campaign-card__meta-label text-mono">{label}</div>
      <div className="campaign-card__meta-value">{value}</div>
    </div>
  );
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
