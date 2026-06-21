// src/pages/Dashboard/DashboardOverview.jsx
import React from 'react';
import { useAuth } from '../../utils/AuthContext';
import CreatorOverview from './CreatorOverview';
import BrandOverview from './BrandOverview';

export default function DashboardOverview() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'brand' ? <BrandOverview /> : <CreatorOverview />;
}
