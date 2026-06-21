// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const CREATOR_LINKS = [
  { to: '/dashboard', label: 'Overview', icon: '◆', end: true },
  { to: '/dashboard/analytics', label: 'Analytics', icon: '▤' },
  { to: '/dashboard/campaign', label: 'Find campaigns', icon: '▣' },
  { to: '/dashboard/profile', label: 'My profile', icon: '◐' },
];

const BRAND_LINKS = [
  { to: '/dashboard', label: 'Overview', icon: '◆', end: true },
  { to: '/dashboard/campaign', label: 'Campaigns', icon: '▣' },
  { to: '/dashboard/matching', label: 'AI matching', icon: '✶' },
  { to: '/dashboard/escrow', label: 'Escrow & payments', icon: '◈' },
  { to: '/dashboard/verification', label: 'Verification', icon: '✓' },
  { to: '/dashboard/analytics', label: 'Analytics', icon: '▤' },
];

export default function Sidebar({ role }) {
  const links = role === 'brand' ? BRAND_LINKS : CREATOR_LINKS;

  return (
    <aside className="ct-sidebar">
      <div className="ct-sidebar__label text-mono">
        {role === 'brand' ? 'BRAND CONSOLE' : 'CREATOR CONSOLE'}
      </div>
      <nav>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `ct-sidebar__link ${isActive ? 'ct-sidebar__link--active' : ''}`}
          >
            <span className="ct-sidebar__icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
