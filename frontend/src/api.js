/**
 * Centralized API client for BhoomiTrack
 */
const BASE_URL = ''; // Proxied via Vite to Django http://127.0.0.1:8000 in dev

export async function apiRequest(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include', // Includes sessionid and cookies
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.detail || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  getMe: () => apiRequest('/api/auth/me/'),
  login: (credentials) => apiRequest('/api/auth/login/', { method: 'POST', body: credentials }),
  signup: (userData) => apiRequest('/api/auth/signup/', { method: 'POST', body: userData }),
  logout: () => apiRequest('/api/auth/logout/', { method: 'POST' }),

  // Dashboard
  getDashboard: () => apiRequest('/api/dashboard/'),
  getStats: () => apiRequest('/api/stats/'),

  // States
  getStates: () => apiRequest('/api/states/'),

  // Parcels
  getParcels: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/parcels/${query ? `?${query}` : ''}`);
  },
  getParcel: (id) => apiRequest(`/api/parcels/${id}/`),
  createParcel: (data) => apiRequest('/api/parcels/', { method: 'POST', body: data }),
  updateParcel: (id, data) => apiRequest(`/api/parcels/${id}/`, { method: 'PATCH', body: data }),
  deleteParcel: (id) => apiRequest(`/api/parcels/${id}/`, { method: 'DELETE' }),

  // Cases
  getCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/cases/${query ? `?${query}` : ''}`);
  },
  getCase: (id) => apiRequest(`/api/cases/${id}/`),
  createCase: (data) => apiRequest('/api/cases/', { method: 'POST', body: data }),
  // Admin
  getAdminUsers: () => apiRequest('/api/admin/users/'),
  setUserRole: (userId, role) => apiRequest(`/api/admin/users/${userId}/set-role/`, { method: 'POST', body: { role } }),
};

