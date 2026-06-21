// src/services/api.js
// Thin fetch wrapper. In dev, Vite proxies /api to the Express backend
// (see vite.config.js). In production, set VITE_API_BASE to the deployed
// backend URL, or leave empty if frontend + backend share an origin.

const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken() {
  return localStorage.getItem('ct_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    /* empty body */
  }

  if (!res.ok) {
    const message =
      data.error ||
      (data.details && data.details[0] && data.details[0].msg) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};

export default api;
