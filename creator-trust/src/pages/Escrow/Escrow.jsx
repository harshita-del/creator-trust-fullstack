// src/pages/Escrow/Escrow.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { collaborationsService } from '../../services/collaborations';
import { paymentsService } from '../../services/payments';
import { PanelCard, EmptyState } from '../../components/Cards/Cards';
import Button from '../../components/Buttons/Button';
import '../Dashboard/Dashboard.css';

const STATUS_COPY = {
  active: { label: 'Active — no funds yet', color: 'var(--text-muted)' },
  content_submitted: { label: 'Content submitted', color: 'var(--ledger-gold-bright)' },
  verified: { label: 'Verified', color: 'var(--trust-green-bright)' },
  completed: { label: 'Completed', color: 'var(--text-secondary)' },
  disputed: { label: 'Disputed', color: 'var(--risk-red-bright)' },
};

export default function Escrow() {
  const { user } = useAuth();
  const [collabs, setCollabs] = useState([]);
  const [paymentsByCollab, setPaymentsByCollab] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const { collaborations } = await collaborationsService.mine();
    setCollabs(collaborations);
    const entries = await Promise.all(
      collaborations.map(async (c) => {
        try {
          const { payments } = await paymentsService.forCollaboration(c.id);
          return [c.id, payments[0] || null];
        } catch {
          return [c.id, null];
        }
      })
    );
    setPaymentsByCollab(Object.fromEntries(entries));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFund(collabId) {
    setBusyId(collabId);
    try {
      const { razorpay_order, demo_mode } = await paymentsService.createOrder(collabId);
      // Demo mode: simulate the Razorpay checkout completing successfully,
      // then call verify directly. In production this is where you'd open
      // the real Razorpay checkout widget using razorpay_order + key_id.
      await paymentsService.verify({
        razorpay_order_id: razorpay_order.id,
        razorpay_payment_id: `demo_pay_${Date.now()}`,
        razorpay_signature: demo_mode ? undefined : '',
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRelease(collabId) {
    setBusyId(collabId);
    try {
      await paymentsService.release(collabId);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading escrow ledger…</p>;

  return (
    <>
      <div className="dash-page-header">
        <h2>Escrow & payments</h2>
        <p>Fund a collaboration into escrow, then release once the deliverable is verified.</p>
      </div>

      {collabs.length === 0 ? (
        <EmptyState icon="◈" title="No collaborations yet" message="Accept a creator's application to start a collaboration." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {collabs.map((c) => {
            const payment = paymentsByCollab[c.id];
            const status = STATUS_COPY[c.status] || { label: c.status, color: 'var(--text-muted)' };
            return (
              <PanelCard key={c.id} title={c.campaign_title} eyebrow={`₹${Number(c.agreed_amount).toLocaleString('en-IN')}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: status.color, fontWeight: 600, marginBottom: 4 }}>{status.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Escrow status: {payment ? payment.status.replace(/_/g, ' ') : 'not funded'}
                    </div>
                  </div>
                  {user.role === 'brand' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      {!payment && (
                        <Button size="sm" variant="primary" loading={busyId === c.id} onClick={() => handleFund(c.id)}>
                          Fund escrow
                        </Button>
                      )}
                      {payment?.status === 'held_in_escrow' && c.status === 'verified' && (
                        <Button size="sm" variant="primary" loading={busyId === c.id} onClick={() => handleRelease(c.id)}>
                          Release to creator
                        </Button>
                      )}
                      {payment?.status === 'released' && (
                        <span style={{ fontSize: 12, color: 'var(--trust-green-bright)', fontWeight: 600 }}>✓ Released</span>
                      )}
                    </div>
                  )}
                </div>
              </PanelCard>
            );
          })}
        </div>
      )}
    </>
  );
}
