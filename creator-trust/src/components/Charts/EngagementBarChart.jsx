// src/components/Charts/EngagementBarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const COLORS = ['#D4A24C', '#2F6F4E', '#C4472B', '#B8862F', '#4FAE7C'];

export default function EngagementBarChart({ data = [] }) {
  if (!data.length) return <div className="ct-chart-empty">No data to chart yet.</div>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(245,241,232,0.08)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(245,241,232,0.15)' }} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(245,241,232,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: '#171A26', border: '1px solid rgba(245,241,232,0.15)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#F5F1E8' }}
          cursor={{ fill: 'rgba(245,241,232,0.04)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
