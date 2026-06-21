// src/components/Footer/Footer.jsx
import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="ct-footer">
      <div className="container ct-footer__inner">
        <div className="ct-footer__brand">
          <div className="ct-nav__brand" style={{ marginBottom: 12 }}>
            <span className="ct-nav__mark">CT</span>
            <span className="ct-nav__name">Creator<em>Trust</em></span>
          </div>
          <p style={{ maxWidth: 280, fontSize: 13 }}>
            Trust infrastructure for the creator economy — verified scores, fair matching, and escrow-backed payments.
          </p>
        </div>

        <div className="ct-footer__col">
          <h5>Platform</h5>
          <a href="#ccs">CCS Score</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </div>
        <div className="ct-footer__col">
          <h5>Company</h5>
          <a href="#">About</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>
        <div className="ct-footer__col">
          <h5>Legal</h5>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
      <div className="container">
        <div className="hr-ledger" style={{ margin: '32px 0 20px' }} />
        <div className="ct-footer__bottom text-mono">
          <span>© {new Date().getFullYear()} CreatorTrust — Built on the ASLICONNECT framework</span>
          <span>Ledger verified ✓</span>
        </div>
      </div>
    </footer>
  );
}
