// src/services/auth.js
import api from './api';

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  persistSession(data);
  return data;
}

export async function signup({ full_name, email, password, role, company_name }) {
  const payload = { full_name, email, password, role };
  if (role === 'brand') payload.company_name = company_name;
  const data = await api.post('/auth/signup', payload);
  persistSession(data);
  return data;
}

export function persistSession({ user, token }) {
  localStorage.setItem('ct_user', JSON.stringify(user));
  localStorage.setItem('ct_token', token);
}

export function getSession() {
  const raw = localStorage.getItem('ct_user');
  const token = localStorage.getItem('ct_token');
  if (!raw || !token) return { user: null, token: null };
  try {
    return { user: JSON.parse(raw), token };
  } catch {
    return { user: null, token: null };
  }
}

export function logout() {
  localStorage.removeItem('ct_user');
  localStorage.removeItem('ct_token');
}
