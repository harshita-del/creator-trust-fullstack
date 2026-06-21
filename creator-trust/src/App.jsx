// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardOverview from './pages/Dashboard/DashboardOverview';
import CreatorProfile from './pages/CreatorProfile/CreatorProfile';
import Campaign from './pages/Campaign/Campaign';
import Matching from './pages/Matching/Matching';
import Escrow from './pages/Escrow/Escrow';
import Verification from './pages/Verification/Verification';
import Analytics from './pages/Analytics/Analytics';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="profile" element={<CreatorProfile />} />
          <Route path="campaign" element={<Campaign />} />
          <Route path="matching" element={<Matching />} />
          <Route path="escrow" element={<Escrow />} />
          <Route path="verification" element={<Verification />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Landing />} />
      </Routes>
    </AuthProvider>
  );
}
