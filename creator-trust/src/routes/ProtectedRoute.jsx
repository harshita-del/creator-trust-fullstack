// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  if (!user || !token) return <Navigate to="/login" replace />;
  return children;
}
