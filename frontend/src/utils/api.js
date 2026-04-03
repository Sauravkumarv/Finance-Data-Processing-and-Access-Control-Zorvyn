const API_BASE = import.meta.env.VITE_API_URL || '';

const authHeader = (token) => token ? { Authorization: `Bearer ${token}` } : {};

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (payload, token) => request('/api/auth/register', { method: 'POST', body: payload, token }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  summary: (token) => request('/api/dashboard/summary', { token }),
  records: {
    list: (token) => request('/api/records', { token }),
    create: (payload, token) => request('/api/records', { method: 'POST', body: payload, token }),
    remove: (id, token) => request(`/api/records/${id}`, { method: 'DELETE', token }),
  },
  users: {
    list: (token) => request('/api/users', { token }),
    update: (id, payload, token) => request(`/api/users/${id}`, { method: 'PATCH', body: payload, token }),
  },
};