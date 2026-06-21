// src/pages/Dashboard/DashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useAuth } from '../../utils/AuthContext';
import './Dashboard.css';

export default function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="dash-shell">
      <Navbar />
      <div className="container dash-shell__inner">
        <Sidebar role={user?.role} />
        <main className="dash-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
