// src/pages/Campaign/Campaign.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { campaignsService } from '../../services/campaigns';
import { applicationsService } from '../../services/applications';
import { PanelCard, EmptyState } from '../../components/Cards/Cards';
import CampaignCard from '../../components/CampaignCard/CampaignCard';
import Button from '../../components/Buttons/Button';
import '../Dashboard/Dashboard.css';

const EMPTY_FORM = {
  title: '', description: '', content_type: 'reel', target_niche: '',
  min_followers: 10000, min_ccs_score: 50, budget: 25000, timeline_days: 14,
};

export default function Campaign() {
  const { user } = useAuth();
  return user.role === 'brand' ? <BrandCampaigns /> : <CreatorCampaigns />;
}

function BrandCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { campaigns } = await campaignsService.list();
      setCampaigns(campaigns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await campaignsService.create(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="dash-page-header">
        <h2>Campaigns</h2>
        <p>Create a campaign — the matching engine ranks creators against it instantly.</p>
      </div>

      <PanelCard title="New campaign" eyebrow="CREATE">
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Summer Skincare Launch" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What should the creator deliver?" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Content type</label>
              <select value={form.content_type} onChange={(e) => update('content_type', e.target.value)}>
                <option value="reel">Reel</option>
                <option value="post">Post</option>
                <option value="video">Video</option>
                <option value="story">Story</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target niche</label>
              <input value={form.target_niche} onChange={(e) => update('target_niche', e.target.value)} placeholder="e.g. beauty, tech" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min followers</label>
              <input type="number" min="0" value={form.min_followers} onChange={(e) => update('min_followers', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Min CCS score</label>
              <input type="number" min="0" max="100" value={form.min_ccs_score} onChange={(e) => update('min_ccs_score', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget (₹)</label>
              <input type="number" min="0" required value={form.budget} onChange={(e) => update('budget', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Timeline (days)</label>
              <input type="number" min="1" value={form.timeline_days} onChange={(e) => update('timeline_days', Number(e.target.value))} />
            </div>
          </div>
          <Button type="submit" variant="primary" loading={submitting}>Launch campaign</Button>
        </form>
      </PanelCard>

      <PanelCard title="All your campaigns" eyebrow="LEDGER">
        {loading ? <p>Loading…</p> : campaigns.length === 0 ? (
          <EmptyState icon="▣" title="No campaigns yet" />
        ) : (
          <div className="dash-grid-cards">
            {campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </PanelCard>
    </>
  );
}

function CreatorCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ campaigns }, { applications }] = await Promise.all([
          campaignsService.list(),
          applicationsService.mine(),
        ]);
        if (!alive) return;
        setCampaigns(campaigns);
        const appliedMap = {};
        applications.forEach((a) => { appliedMap[a.campaign_id] = a.status; });
        setApplied(appliedMap);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function handleApply(campaignId) {
    setApplied((a) => ({ ...a, [campaignId]: 'applying' }));
    try {
      await applicationsService.apply(campaignId);
      setApplied((a) => ({ ...a, [campaignId]: 'pending' }));
    } catch (err) {
      alert(err.message);
      setApplied((a) => { const next = { ...a }; delete next[campaignId]; return next; });
    }
  }

  return (
    <>
      <div className="dash-page-header">
        <h2>Open campaigns</h2>
        <p>Apply to campaigns that fit your niche — your match score is calculated against each one.</p>
      </div>

      {error && <EmptyState icon="⚠" title="Couldn't load campaigns" message={error} />}
      {loading ? <p>Loading…</p> : campaigns.length === 0 ? (
        <EmptyState icon="▣" title="No open campaigns right now" message="Check back soon — new campaigns appear here as brands post them." />
      ) : (
        <div className="dash-grid-cards">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onPrimary={applied[c.id] ? undefined : () => handleApply(c.id)}
              primaryLabel={applied[c.id] === 'applying' ? 'Applying…' : 'Apply now'}
              footer={applied[c.id] && applied[c.id] !== 'applying' && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--trust-green-bright)', marginTop: 10, fontWeight: 600 }}>
                  ✓ Applied — {applied[c.id]}
                </div>
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}
