// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import Button from '../Buttons/Button';
import './Navbar.css';

const PUBLIC_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'CCS Score', href: '#ccs' },
  { label: 'Features', href: '#features' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLanding = location.pathname === '/';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className={`ct-nav ${scrolled ? 'ct-nav--scrolled' : ''}`}>
      <div className="container ct-nav__inner">
        <Link to="/" className="ct-nav__brand">
          <span className="ct-nav__mark">CT</span>
          <span className="ct-nav__name">Creator<em>Trust</em></span>
        </Link>

        {isLanding && (
          <nav className="ct-nav__links">
            {PUBLIC_LINKS.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>
        )}

        <div className="ct-nav__cta">
          {user ? (
            <>
              <Link to="/dashboard" className="ct-nav__user">
                <span className="ct-nav__dot" />
                {user.full_name}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">Log in</Button>
              <Button as={Link} to="/login?mode=signup" variant="primary" size="sm">Get started</Button>
            </>
          )}
        </div>

        <button className="ct-nav__burger" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && (
        <div className="ct-nav__mobile">
          {isLanding && PUBLIC_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <a onClick={handleLogout}>Log out</a>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link to="/login?mode=signup" onClick={() => setMobileOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
