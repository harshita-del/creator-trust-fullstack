// src/utils/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSession, login as loginRequest, signup as signupRequest, logout as logoutSession } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    setSession({ user: data.user, token: data.token });
    return data;
  }, []);

  const signup = useCallback(async (fields) => {
    const data = await signupRequest(fields);
    setSession({ user: data.user, token: data.token });
    return data;
  }, []);

  const logout = useCallback(() => {
    logoutSession();
    setSession({ user: null, token: null });
  }, []);

  const updateUser = useCallback((patch) => {
    setSession((prev) => {
      const user = { ...prev.user, ...patch };
      localStorage.setItem('ct_user', JSON.stringify(user));
      return { ...prev, user };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user: session.user, token: session.token, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
