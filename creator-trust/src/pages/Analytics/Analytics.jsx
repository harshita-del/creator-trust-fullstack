// src/pages/Analytics/Analytics.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { creatorsService } from '../../services/creators';
import { campaignsService } from '../../services/campaigns';
import { PanelCard, StatCard, EmptyState } from '../../components/Cards/Cards';
import EngagementBarChart from '../../components/Charts/EngagementBarChart';
import '../../components/Charts/Charts.css';
import '../Dashboard/Dashboard.css';

export default function Analytics() {
  const { user } = useAuth();
  return user.role === 'brand' ? <BrandAnalytics /> : <CreatorAnalytics />;
}

function CreatorAnalytics() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    creatorsService.getMyProfile().then(({ profile }) => setProfile(profile)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading analytics…</p>;
  if (!profile) return <EmptyState icon="⚠" title="Couldn't load analytics" />;

  const factorData = [
    { label: 'Audience', value: Number(profile.audience_quality_score) },
    { label: 'Engagement', value: Number(profile.engagement_auth_score) },
    { label: 'History', value: Number(profile.campaign_history_score) },
    { label: 'Fraud safety', value: Number(profile.fraud_detection_score) },
    { label: 'Brand fdbk', value: Number(profile.brand_reliability_score) },
  ];

  return (
    <>
      <div className="dash-page-header">
        <h2>Analytics</h2>
        <p>What's moving your CCS, broken down by factor.</p>
      </div>

      <div className="dash-stats-row">
        <StatCard label="CCS score" value={Number(profile.ccs_score).toFixed(1)} accent="var(--ledger-gold-bright)" />
        <StatCard label="Tier" value={profile.ccs_tier} />
        <StatCard label="Fake follower est." value={`${profile.fake_follower_pct}%`} accent={profile.fake_follower_pct > 10 ? 'var(--risk-red-bright)' : 'var(--trust-green-bright)'} />
        <StatCard label="Engagement rate" value={`${profile.avg_engagement_rate}%`} />
      </div>

      <PanelCard title="CCS factor breakdown" eyebrow="THIS MONTH">
        <EngagementBarChart data={factorData} />
      </PanelCard>
    </>
  );
}

function BrandAnalytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignsService.list().then(({ campaigns }) => setCampaigns(campaigns)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading analytics…</p>;

  const statusCounts = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }));
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);

  return (
    <>
      <div className="dash-page-header">
        <h2>Analytics</h2>
        <p>Campaign pipeline at a glance.</p>
      </div>

      <div className="dash-stats-row">
        <StatCard label="Total campaigns" value={campaigns.length} />
        <StatCard label="Total budget allocated" value={`₹${totalBudget.toLocaleString('en-IN')}`} accent="var(--ledger-gold-bright)" />
      </div>

      <PanelCard title="Campaigns by status" eyebrow="PIPELINE">
        {chartData.length === 0 ? <EmptyState icon="▤" title="No campaign data yet" /> : <EngagementBarChart data={chartData} />}
      </PanelCard>
    </>
  );
}
