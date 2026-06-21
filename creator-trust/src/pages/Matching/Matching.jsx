// src/pages/Matching/Matching.jsx
import React, { useEffect, useState } from 'react';
import { campaignsService } from '../../services/campaigns';
import { applicationsService } from '../../services/applications';
import { PanelCard, EmptyState } from '../../components/Cards/Cards';
import CreatorCard from '../../components/CreatorCard/CreatorCard';
import '../Dashboard/Dashboard.css';

export default function Matching() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    campaignsService.list()
      .then(({ campaigns }) => {
        setCampaigns(campaigns);
        if (campaigns.length) setSelectedId(campaigns[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMatches(true);
    setError('');
    campaignsService.getMatches(selectedId)
      .then(({ matches }) => setMatches(matches))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMatches(false));
  }, [selectedId]);

  async function shortlist(creatorId) {
    try {
      const { applications } = await applicationsService.forCampaign(selectedId);
      const application = applications.find((a) => a.creator_id === creatorId);
      if (!application) {
        alert('This creator hasn\'t applied yet — they appear here as a suggested match. Invite flows can be added; for now, shortlisting works on creators who have applied.');
        return;
      }
      await applicationsService.updateStatus(application.id, 'shortlisted');
      alert('Shortlisted!');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="dash-page-header">
        <h2>AI matching</h2>
        <p>Creators ranked by niche fit, follower range, CCS, engagement quality, and location.</p>
      </div>

      <PanelCard title="Select a campaign" eyebrow="STEP 1">
        {loadingCampaigns ? <p>Loading campaigns…</p> : campaigns.length === 0 ? (
          <EmptyState icon="▣" title="No campaigns yet" message="Create a campaign first to see matches." />
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ padding: '11px 13px', borderRadius: 8, background: 'var(--ink)', border: '1px solid var(--line)', color: 'var(--text-primary)', fontSize: 13.5, width: '100%', maxWidth: 400 }}
          >
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </PanelCard>

      {error && <EmptyState icon="⚠" title="Couldn't load matches" message={error} />}

      {selectedId && (
        <PanelCard title="Ranked matches" eyebrow="STEP 2">
          {loadingMatches ? <p>Computing matches…</p> : matches.length === 0 ? (
            <EmptyState icon="✶" title="No matching creators found" message="Try lowering the campaign's minimum followers or CCS threshold." />
          ) : (
            <div className="dash-grid-cards">
              {matches.map((m) => (
                <CreatorCard
                  key={m.id}
                  creator={m}
                  matchScore={m.match_score}
                  breakdown={m.breakdown}
                  onAction={() => shortlist(m.id)}
                  actionLabel="Shortlist"
                />
              ))}
            </div>
          )}
        </PanelCard>
      )}
    </>
  );
}
