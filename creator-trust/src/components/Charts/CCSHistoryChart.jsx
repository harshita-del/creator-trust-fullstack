// src/components/Charts/CCSHistoryChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CCSHistoryChart({ data = [] }) {
  const formatted = data.map((d) => ({
    date: new Date(d.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: Number(d.ccs_score),
    reason: d.reason,
  }));

  if (formatted.length === 0) {
    return <div className="ct-chart-empty">No score history yet — your CCS will track here as it changes.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(245,241,232,0.08)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(245,241,232,0.15)' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: '#171A26', border: '1px solid rgba(245,241,232,0.15)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#F5F1E8' }}
          formatter={(value, name, props) => [`${value}`, props.payload.reason || 'CCS Score']}
        />
        <Line type="monotone" dataKey="score" stroke="#D4A24C" strokeWidth={2.5} dot={{ r: 3, fill: '#D4A24C' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
