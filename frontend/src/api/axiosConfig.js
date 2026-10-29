import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitness_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('fitness_token');
      localStorage.removeItem('fitness_user');
      // If not already on login page, redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const memberApi = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

export const trainerApi = {
  getAll: (params) => api.get('/trainers', { params }),
  getById: (id) => api.get(`/trainers/${id}`),
  create: (data) => api.post('/trainers', data),
  update: (id, data) => api.put(`/trainers/${id}`, data),
  assign: (id, memberIds) => api.post(`/trainers/${id}/assign`, { memberIds }),
  delete: (id) => api.delete(`/trainers/${id}`),
};

export const membershipApi = {
  getAll: (params) => api.get('/memberships', { params }),
  getById: (id) => api.get(`/memberships/${id}`),
  create: (data) => api.post('/memberships', data),
  update: (id, data) => api.put(`/memberships/${id}`, data),
  delete: (id) => api.delete(`/memberships/${id}`),
};

export const subscriptionApi = {
  getAll: (params) => api.get('/subscriptions', { params }),
  getMy: () => api.get('/subscriptions/my'),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
};

export const workoutPlanApi = {
  getAll: (params) => api.get('/workout-plans', { params }),
  getById: (id) => api.get(`/workout-plans/${id}`),
  create: (data) => api.post('/workout-plans', data),
  update: (id, data) => api.put(`/workout-plans/${id}`, data),
  delete: (id) => api.delete(`/workout-plans/${id}`),
};

export const scheduleApi = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  book: (id) => api.post(`/schedules/${id}/book`),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const attendanceApi = {
  getAll: (params) => api.get('/attendance', { params }),
  getMy: () => api.get('/attendance/my'),
  record: (data) => api.post('/attendance', data),
  checkOut: (id, data) => api.put(`/attendance/${id}/checkout`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

export const progressApi = {
  getByMember: (memberId) => api.get(`/progress/${memberId}`),
  create: (data) => api.post('/progress', data),
  delete: (id) => api.delete(`/progress/${id}`),
};

export const dashboardApi = {
  getAdmin: () => api.get('/dashboard/admin'),
  getTrainer: () => api.get('/dashboard/trainer'),
  getMember: () => api.get('/dashboard/member'),
};

export default api;
