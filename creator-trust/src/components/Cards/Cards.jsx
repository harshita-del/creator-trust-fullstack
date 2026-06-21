// src/components/Cards/Cards.jsx
import React from 'react';
import './Cards.css';

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="ct-stat-card">
      <div className="ct-stat-card__label text-mono">{label}</div>
      <div className="ct-stat-card__value" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="ct-stat-card__sub">{sub}</div>}
    </div>
  );
}

export function PanelCard({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`ct-panel ${className}`}>
      {(title || eyebrow || action) && (
        <div className="ct-panel__header">
          <div>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
            {title && <h3 className="ct-panel__title">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon = '📭', title, message }) {
  return (
    <div className="ct-empty">
      <div className="ct-empty__icon">{icon}</div>
      <div className="ct-empty__title">{title}</div>
      {message && <div className="ct-empty__message">{message}</div>}
    </div>
  );
}
