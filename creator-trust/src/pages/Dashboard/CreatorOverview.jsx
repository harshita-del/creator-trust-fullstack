// src/pages/Dashboard/CreatorOverview.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { creatorsService } from '../../services/creators';
import { applicationsService } from '../../services/applications';
import { statsService } from '../../services/stats';
import CCSCertificate from '../../components/Charts/CCSCertificate';
import { StatCard, PanelCard, EmptyState } from '../../components/Cards/Cards';
import Button from '../../components/Buttons/Button';

export default function CreatorOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, s, a] = await Promise.all([
          creatorsService.getMyProfile(),
          statsService.dashboard(),
          applicationsService.mine(),
        ]);
        if (!alive) return;
        setProfile(p.profile);
        setStats(s);
        setApplications(a.applications);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="dash-page-header"><p>Loading your ledger…</p></div>;
  if (error) return <EmptyState icon="⚠" title="Couldn't load dashboard" message={error} />;

  return (
    <>
      <div className="dash-page-header">
        <h2>Welcome back, {user.full_name.split(' ')[0]}</h2>
        <p>Here's where your trust score and pipeline stand today.</p>
      </div>

      <div className="dash-stats-row">
        <StatCard label="Applications sent" value={stats.total_applications} />
        <StatCard label="Active collaborations" value={stats.active_collaborations} />
        <StatCard label="Followers" value={Number(profile.follower_count).toLocaleString()} />
        <StatCard label="Engagement rate" value={`${profile.avg_engagement_rate}%`} />
      </div>

      <div className="dash-two-col">
        <div>
          <CCSCertificate profile={profile} />
        </div>
        <div>
          <PanelCard title="Recent applications" eyebrow="PIPELINE">
            {applications.length === 0 ? (
              <EmptyState icon="📨" title="No applications yet" message="Browse open campaigns to get started." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {applications.slice(0, 5).map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{a.campaign_title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Match {a.match_score}%</div>
                    </div>
                    <span className="text-mono" style={{ fontSize: 11, color: 'var(--ledger-gold-bright)', textTransform: 'uppercase' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
            <Button as={Link} to="/dashboard/campaign" variant="outline" size="sm" style={{ marginTop: 16, width: '100%' }}>
              Browse campaigns
            </Button>
          </PanelCard>
        </div>
      </div>
    </>
  );
}
