// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Backend app.py sur 5000

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Essentiel pour sessions/cookies dans app.py (@login_required)
  timeout: 10000, // Augmenté à 10s pour éviter timeouts dev
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour CSRF : Fetch token si pas présent pour POST/PUT/DELETE (comme dans app.py)
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete'].includes(config.method?.toLowerCase()) && config.url !== '/login') {
    try {
      const { data: { csrf_token } } = await api.get('/api/csrf_token');
      config.headers['X-CSRF-Token'] = csrf_token;
    } catch (err) {
      console.error('Erreur CSRF token:', err); // Debug
    }
  }
  return config;
});

// Intercepteur réponse pour errors globales (ex. 401/500 de app.py)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Auth expirée – redirect login'); // Hook à ton AuthContext si besoin
    } else if (error.code === 'ECONNABORTED') {
      console.error('Timeout API – retry?'); // Ajoute retry logic si besoin
    }
    return Promise.reject(error);
  }
);

// Auth (sessions app.py)
export const authAPI = {
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/api/user'), // FIX : Utilisé pour refetch dans Profil (ajoute cette route dans app.py si manquante : GET /api/user renvoyant user complet)
  updateProfil: (data) => api.post('/profil', data),
  uploadAvatar: (formData) => api.post('/profil', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeAvatar: () => api.post('/profil', { action: 'remove_avatar' }),
};

// Clients (routes app.py)
export const clientsAPI = {
  getAll: (params = {}) => api.get('/api/clients', { params }), // ?page=1&per_page=10&search=&statut=tous&...
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients/add', data),
  update: (id, data) => api.put(`/clients/${id}/edit`, data),
  delete: (id) => api.post(`/clients/${id}/delete`),
  addPayment: (id, data) => api.post(`/clients/${id}/paiement`, data),
  relance: (id) => api.post(`/clients/${id}/relance`),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/clients/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportCSV: (params = {}) => api.get('/api/clients/export', { params, responseType: 'blob' }), // Download CSV
};

// Historique (app.py)
export const historiqueAPI = {
  getAll: (params = {}) => api.get('/api/historique', { params }), // ?page=1&per_page=10&search_client=&action=tous&...
};

// Users (admin, app.py)
export const usersAPI = {
  getAll: () => api.get('/admin/users'),
  updateRole: (data) => api.post('/admin/users', data), // {user_id, role}
};

// Connexions (admin, app.py)
export const connexionsAPI = {
  getAll: (params = {}) => api.get('/admin/connexions', { params }), // Similaire à historique
};

// Stats (app.py : /api/stats avec sessions, pas Bearer !)
export const statsAPI = async (token) => { // Token pas utilisé (sessions), mais gardé pour compat
  try {
    const response = await api.get('/api/stats'); // Utilise api configuré : cookies + withCredentials
    console.log('Stats loaded:', response.data); // Debug : check backend data (retard, avenir, etc.)
    return response.data;
  } catch (err) {
    console.error('Erreur statsAPI:', err.response?.data || err.message);
    throw err; // Propagé à fetchStats pour toast/error
  }
};

// Countries (app.py)
export const countriesAPI = {
  getAll: () => api.get('/api/countries'),
};

export default api;