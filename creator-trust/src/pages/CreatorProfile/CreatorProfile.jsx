// src/pages/CreatorProfile/CreatorProfile.jsx
import React, { useEffect, useState } from 'react';
import { creatorsService } from '../../services/creators';
import CCSCertificate from '../../components/Charts/CCSCertificate';
import { PanelCard } from '../../components/Cards/Cards';
import Button from '../../components/Buttons/Button';
import '../Dashboard/Dashboard.css';

export default function CreatorProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    creatorsService.getMyProfile()
      .then(({ profile }) => { setProfile(profile); setForm(toForm(profile)); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setJustSaved(false);
    try {
      const { profile: updated } = await creatorsService.updateMyProfile({
        niche: form.niche,
        location: form.location,
        bio: form.bio,
        follower_count: Number(form.follower_count),
        avg_engagement_rate: Number(form.avg_engagement_rate),
        fake_follower_pct: Number(form.fake_follower_pct),
        instagram_handle: form.instagram_handle,
      });
      setProfile(updated);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile…</p>;
  if (!profile) return <p>{error}</p>;

  return (
    <>
      <div className="dash-page-header">
        <h2>My profile</h2>
        <p>Update your stats — your CCS recalculates the instant you save.</p>
      </div>

      <div className="dash-two-col">
        <PanelCard title="Edit your signals" eyebrow="EDITABLE">
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          {justSaved && (
            <div style={{ background: 'rgba(79,174,124,0.1)', border: '1px solid rgba(79,174,124,0.3)', color: 'var(--trust-green-bright)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
              ✓ Saved — your CCS has been recalculated.
            </div>
          )}
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Niche</label>
                <input value={form.niche} onChange={(e) => update('niche', e.target.value)} placeholder="e.g. Fashion" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Mumbai" />
              </div>
            </div>
            <div className="form-group">
              <label>Instagram handle</label>
              <input value={form.instagram_handle} onChange={(e) => update('instagram_handle', e.target.value)} placeholder="@yourhandle" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Follower count</label>
                <input type="number" min="0" value={form.follower_count} onChange={(e) => update('follower_count', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Avg engagement rate (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.avg_engagement_rate} onChange={(e) => update('avg_engagement_rate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Estimated fake follower %</label>
              <input type="number" step="0.1" min="0" max="100" value={form.fake_follower_pct} onChange={(e) => update('fake_follower_pct', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} />
            </div>
            <Button type="submit" variant="primary" loading={saving}>Save & recalculate CCS</Button>
          </form>
        </PanelCard>

        <div>
          <CCSCertificate profile={profile} animate={true} />
        </div>
      </div>
    </>
  );
}

function toForm(p) {
  return {
    niche: p.niche || '',
    location: p.location || '',
    bio: p.bio || '',
    instagram_handle: p.instagram_handle || '',
    follower_count: p.follower_count || 0,
    avg_engagement_rate: p.avg_engagement_rate || 0,
    fake_follower_pct: p.fake_follower_pct || 0,
  };
}
