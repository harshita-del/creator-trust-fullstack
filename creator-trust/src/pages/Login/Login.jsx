// src/pages/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import Button from '../../components/Buttons/Button';
import './Login.css';

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState(params.get('role') === 'brand' ? 'brand' : 'creator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', password: '', company_name: '' });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup({ ...form, role });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <Link to="/" className="ct-nav__brand" style={{ marginBottom: 36 }}>
          <span className="ct-nav__mark">CT</span>
          <span className="ct-nav__name">Creator<em>Trust</em></span>
        </Link>

        <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your ledger'}</h2>
        <p className="auth-sub">
          {mode === 'login' ? 'Log in to access your dashboard.' : 'Join as a brand or creator — takes under two minutes.'}
        </p>

        {mode === 'signup' && (
          <div className="role-toggle">
            <button type="button" className={`role-toggle__btn ${role === 'creator' ? 'active' : ''}`} onClick={() => setRole('creator')}>
              🎨 Creator
            </button>
            <button type="button" className={`role-toggle__btn ${role === 'brand' ? 'active' : ''}`} onClick={() => setRole('brand')}>
              🏢 Brand
            </button>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <Field label="Full name">
              <input required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Your name" />
            </Field>
          )}
          {mode === 'signup' && role === 'brand' && (
            <Field label="Company name">
              <input value={form.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="Your brand" />
            </Field>
          )}
          <Field label="Email">
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('signup')}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')}>Log in</a></>
          )}
        </p>

        <p className="auth-demo text-mono">
          Demo: aisha.creator@example.com / meera.brand@example.com — password Password123!
        </p>
      </div>

      <div className="auth-page__side">
        <div className="auth-side__quote">
          <div className="auth-side__mark text-mono">FROM THE LEDGER</div>
          <p>"Brands stopped asking for screenshots. They just check the score."</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
