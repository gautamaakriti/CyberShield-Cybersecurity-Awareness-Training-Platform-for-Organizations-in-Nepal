import axios from 'axios';

const API_BASE = 'http://localhost:8001';

// Admin API instance (attaches admin JWT)
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// Employee API instance
export const empApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Admin APIs

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const modulesApi = {
  list: () => api.get('/modules'),
  get: (id: number) => api.get(`/modules/${id}`),
  create: (data: FormData) =>
    api.post('/modules', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: number, data: FormData) =>
    api.put(`/modules/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: number) => api.delete(`/modules/${id}`),
};

export const quizzesApi = {
  create: (moduleId: number, data: any) =>
    api.post(`/modules/${moduleId}/quiz`, data),
  get: (moduleId: number) =>
    api.get(`/modules/${moduleId}/quiz`),
};

export const employeesApi = {
  list: () => api.get('/employees'),
  create: (data: any) => api.post('/employees', data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  assignModules: (employee_ids: number[], module_ids: number[]) =>
    api.post('/employees/assign-modules', { employee_ids, module_ids }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  progress: () => api.get('/dashboard/progress'),
  deleteProgress: (id: number) => api.delete(`/dashboard/progress/${id}`),
  resetAllProgress: () => api.delete('/dashboard/progress'),
};

// Employee APIs

export const employeeAuthApi = {
  login: (email: string, password: string) =>
    empApi.post('/employees/login', { email, password }),
  getMyModules: (token: string) =>
    empApi.get(`/employees/my-modules?token=${token}`),
};

export const trainingApi = {
  validateToken: (token: string) =>
    empApi.get(`/training/${token}`),
  completeVideo: (token: string) =>
    empApi.post(`/training/${token}/video-complete`),
  submitQuiz: (token: string, answers: Record<number, string>) =>
    empApi.post(`/training/${token}/submit-quiz`, { answers }),
  getResult: (token: string) =>
    empApi.get(`/training/${token}/result`),
};