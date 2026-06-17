import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Chrome Extension Bridge ──────────────────────────────────────────────────
// Syncs login/logout state into chrome.storage.local for CareerForge Clipper
export const notifyExtensionLogin = (token, user) => {
  try {
    window.postMessage({ type: 'CAREERFORGE_LOGIN', token, user }, '*');
  } catch (e) { /* Ignore */ }
};

export const notifyExtensionLogout = () => {
  try {
    window.postMessage({ type: 'CAREERFORGE_LOGOUT' }, '*');
  } catch (e) { /* Ignore */ }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const googleLogin = (data) => api.post('/auth/google', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/profile', data);
export const changePassword = (data) => api.patch('/auth/change-password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const deleteAccount = () => api.delete('/auth/account');

// ─── Applications ─────────────────────────────────────────────────────────────
export const getApplications = (params) => api.get('/applications', { params });
export const createApplication = (data) => api.post('/applications', data);
export const getApplication = (id) => api.get(`/applications/${id}`);
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getApplicationStats = () => api.get('/applications/stats');
export const getActivityLog = () => api.get('/applications/activity');

// ─── Interviews ───────────────────────────────────────────────────────────────
export const getInterviewRounds = (applicationId) => api.get(`/interviews/${applicationId}`);
export const addRound = (applicationId, data) => api.post(`/interviews/${applicationId}`, data);
export const updateRound = (roundId, data) => api.patch(`/interviews/round/${roundId}`, data);
export const deleteRound = (roundId) => api.delete(`/interviews/round/${roundId}`);

// ─── Resumes ──────────────────────────────────────────────────────────────────
export const getResumes = () => api.get('/resumes');
export const uploadResume = (formData) =>
  api.post('/resumes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteResume = (id) => api.delete(`/resumes/${id}`);

// ─── Reminders ────────────────────────────────────────────────────────────────
export const getReminders = () => api.get('/reminders');
export const createReminder = (data) => api.post('/reminders', data);
export const updateReminder = (id, data) => api.patch(`/reminders/${id}`, data);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);

export default api;
