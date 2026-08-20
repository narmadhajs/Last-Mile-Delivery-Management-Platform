import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('logitrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts'),
};

export const rateApi = {
  calculateQuote: (data: any) => api.post('/rates/calculate', data),
  getRateCards: () => api.get('/rates/cards'),
  createRateCard: (data: any) => api.post('/rates/cards', data),
  updateRateCard: (id: string, data: any) => api.put(`/rates/cards/${id}`, data),
  deleteRateCard: (id: string) => api.delete(`/rates/cards/${id}`),
};

export const zoneApi = {
  getAllZones: () => api.get('/zones'),
  getZoneById: (id: string) => api.get(`/zones/${id}`),
  createZone: (data: any) => api.post('/zones', data),
  updateZone: (id: string, data: any) => api.put(`/zones/${id}`, data),
  addArea: (zoneId: string, data: any) => api.post(`/zones/${zoneId}/areas`, data),
  removeArea: (areaId: string) => api.delete(`/zones/areas/${areaId}`),
  lookupPincode: (pincode: string) => api.get(`/zones/lookup/${pincode}`),
};

export const orderApi = {
  createOrder: (data: any) => api.post('/orders', data),
  getOrders: (params?: any) => api.get('/orders', { params }),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  trackOrder: (trackingNumber: string) => api.get(`/orders/track/${trackingNumber}`),
  getCandidates: (id: string) => api.get(`/orders/${id}/candidates`),
  updateStatus: (id: string, data: any) => api.patch(`/orders/${id}/status`, data),
  reschedule: (id: string, data: any) => api.post(`/orders/${id}/reschedule`, data),
  autoAssign: (id: string) => api.post(`/orders/${id}/auto-assign`),
  manualAssign: (id: string, agentId: string) => api.post(`/orders/${id}/assign`, { agentId }),
  adminOverride: (id: string, data: any) => api.patch(`/orders/${id}/admin-override`, data),
};

export const agentApi = {
  getAllAgents: (params?: any) => api.get('/agents', { params }),
  getAgentById: (id: string) => api.get(`/agents/${id}`),
  updateProfile: (data: any) => api.patch('/agents/profile', data),
  updateAgentById: (id: string, data: any) => api.patch(`/agents/${id}/profile`, data),
};

export const analyticsApi = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
};

export const notificationApi = {
  getMyNotifications: () => api.get('/notifications/my'),
  getAllNotifications: () => api.get('/notifications/all'),
  getAuditLogs: () => api.get('/notifications/audit-logs'),
};

export default api;
