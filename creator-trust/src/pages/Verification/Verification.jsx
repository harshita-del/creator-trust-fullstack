// src/pages/Verification/Verification.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { collaborationsService } from '../../services/collaborations';
import { PanelCard, EmptyState } from '../../components/Cards/Cards';
import Button from '../../components/Buttons/Button';
import '../Dashboard/Dashboard.css';

export default function Verification() {
  const { user } = useAuth();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlDrafts, setUrlDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const { collaborations } = await collaborationsService.mine();
    setCollabs(collaborations);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submitDeliverable(id) {
    const url = urlDrafts[id];
    if (!url) return alert('Paste a link to your deliverable first.');
    setBusyId(id);
    try {
      await collaborationsService.submitDeliverable(id, url);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function verify(id) {
    setBusyId(id);
    try {
      await collaborationsService.verify(id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function complete(id) {
    const rating = Number(prompt('Rate this collaboration 1-5:', '5'));
    if (!rating || rating < 1 || rating > 5) return;
    setBusyId(id);
    try {
      await collaborationsService.complete(id, rating);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <>
      <div className="dash-page-header">
        <h2>Verification</h2>
        <p>{user.role === 'creator' ? 'Submit your deliverable for brand review.' : 'Review and verify submitted deliverables.'}</p>
      </div>

      {collabs.length === 0 ? (
        <EmptyState icon="✓" title="No active collaborations" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {collabs.map((c) => (
            <PanelCard key={c.id} title={c.campaign_title} eyebrow={c.status.replace(/_/g, ' ').toUpperCase()}>
              {c.deliverable_url && (
                <p style={{ fontSize: 13, marginBottom: 14 }}>
                  Deliverable: <a href={c.deliverable_url} target="_blank" rel="noreferrer" style={{ color: 'var(--ledger-gold-bright)' }}>{c.deliverable_url}</a>
                </p>
              )}

              {user.role === 'creator' && c.status === 'active' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    placeholder="https://instagram.com/p/..."
                    value={urlDrafts[c.id] || ''}
                    onChange={(e) => setUrlDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                    style={{ flex: 1, padding: '10px 13px', borderRadius: 8, background: 'var(--ink)', border: '1px solid var(--line)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                  <Button size="sm" variant="primary" loading={busyId === c.id} onClick={() => submitDeliverable(c.id)}>Submit</Button>
                </div>
              )}

              {user.role === 'brand' && c.status === 'content_submitted' && (
                <Button size="sm" variant="primary" loading={busyId === c.id} onClick={() => verify(c.id)}>Verify deliverable</Button>
              )}

              {c.status === 'verified' && (
                <Button size="sm" variant="outline" loading={busyId === c.id} onClick={() => complete(c.id)}>Mark complete & rate</Button>
              )}

              {c.status === 'completed' && (
                <span style={{ fontSize: 12, color: 'var(--trust-green-bright)', fontWeight: 600 }}>✓ Collaboration completed</span>
              )}
            </PanelCard>
          ))}
        </div>
      )}
    </>
  );
}
