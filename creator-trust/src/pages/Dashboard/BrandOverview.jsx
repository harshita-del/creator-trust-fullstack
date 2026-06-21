// src/pages/Dashboard/BrandOverview.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { campaignsService } from '../../services/campaigns';
import { statsService } from '../../services/stats';
import { StatCard, PanelCard, EmptyState } from '../../components/Cards/Cards';
import CampaignCard from '../../components/CampaignCard/CampaignCard';
import Button from '../../components/Buttons/Button';

export default function BrandOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, c] = await Promise.all([statsService.dashboard(), campaignsService.list()]);
        if (!alive) return;
        setStats(s);
        setCampaigns(c.campaigns);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="dash-page-header"><p>Loading your console…</p></div>;
  if (error) return <EmptyState icon="⚠" title="Couldn't load dashboard" message={error} />;

  return (
    <>
      <div className="dash-page-header">
        <h2>{user.company_name || user.full_name}</h2>
        <p>Your campaigns, spend, and active collaborations at a glance.</p>
      </div>

      <div className="dash-stats-row">
        <StatCard label="Total campaigns" value={stats.total_campaigns} />
        <StatCard label="Active collaborations" value={stats.active_collaborations} />
        <StatCard label="Total spend" value={`₹${Number(stats.total_spend).toLocaleString('en-IN')}`} accent="var(--ledger-gold-bright)" />
      </div>

      <PanelCard
        title="Your campaigns"
        eyebrow="LEDGER"
        action={<Button as={Link} to="/dashboard/campaign" size="sm" variant="primary">+ New campaign</Button>}
      >
        {campaigns.length === 0 ? (
          <EmptyState icon="▣" title="No campaigns yet" message="Create your first campaign to start matching with creators." />
        ) : (
          <div className="dash-grid-cards">
            {campaigns.slice(0, 6).map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </PanelCard>
    </>
  );
}
