import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  enable2FA: () => api.post('/auth/2fa/enable'),
  verify2FA: (data) => api.post('/auth/2fa/verify', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
};

export const organizationsAPI = {
  list: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  patchStatus: (id, data) => api.patch(`/organizations/${id}/status`, data),
  getUsers: (id, params) => api.get(`/organizations/${id}/users`, { params }),
  getProjects: (id, params) => api.get(`/organizations/${id}/projects`, { params }),
  getStats: (id) => api.get(`/organizations/${id}/stats`),
};

export const usersAPI = {
  listInternal: (params) => api.get('/users/internal', { params }),
  listClients: (params) => api.get('/users/clients', { params }),
  getById: (id) => api.get(`/users/${id}`),
  createInternal: (data) => api.post('/users/internal', data),
  createClient: (data) => api.post('/users/clients', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  patchRole: (type, id, data) => api.patch(`/users/${type}/${id}/role`, data),
  patchStatus: (id, data) => api.patch(`/users/${id}/status`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  patchStatus: (id, data) => api.patch(`/projects/${id}/status`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  dashboardStats: (params) => api.get('/projects/dashboard/stats', { params }),
};

export const briefsAPI = {
  list: (params) => api.get('/briefs', { params }),
  getById: (id) => api.get(`/briefs/${id}`),
  create: (data) => api.post('/briefs', data),
  update: (id, data) => api.put(`/briefs/${id}`, data),
  addAttachment: (id, formData) =>
    api.post(`/briefs/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeAttachment: (id, attachId) => api.delete(`/briefs/${id}/attachments/${attachId}`),
};

export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  patchStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
  getComments: (id) => api.get(`/tasks/${id}/comments`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  removeComment: (id, cid) => api.delete(`/tasks/${id}/comments/${cid}`),
};

export const proposalsAPI = {
  list: (params) => api.get('/proposals', { params }),
  getById: (id) => api.get(`/proposals/${id}`),
  create: (data) =>
    api.post('/proposals', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  update: (id, data) => api.put(`/proposals/${id}`, data),
  submit: (id) => api.patch(`/proposals/${id}/submit`),
  getComments: (id) => api.get(`/proposals/${id}/comments`),
  addComment: (id, data) => api.post(`/proposals/${id}/comments`, data),
};

export const validationsAPI = {
  list: (params) => api.get('/validations', { params }),
  getByProposal: (proposalId) => api.get(`/validations/proposal/${proposalId}`),
  create: (data) => api.post('/validations', data),
};

export const publicationsAPI = {
  list: (params) => api.get('/publications', { params }),
  getById: (id) => api.get(`/publications/${id}`),
  create: (data) => api.post('/publications', data),
  update: (id, data) => api.put(`/publications/${id}`, data),
  remove: (id) => api.delete(`/publications/${id}`),
};

export const calendarAPI = {
  list: (params) => api.get('/calendar', { params }),
  getById: (id) => api.get(`/calendar/${id}`),
  create: (data) => api.post('/calendar', data),
  update: (id, data) => api.put(`/calendar/${id}`, data),
  remove: (id) => api.delete(`/calendar/${id}`),
};

export const mediaAPI = {
  list: (params) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  upload: (formData) =>
    api.post('/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => api.put(`/media/${id}`, data),
  remove: (id) => api.delete(`/media/${id}`),
  download: (id) => api.get(`/media/${id}/download`, { responseType: 'blob' }),
};

export const reportingAPI = {
  overview: (params) => api.get('/reporting/overview', { params }),
  projects: (params) => api.get('/reporting/projects', { params }),
  users: (params) => api.get('/reporting/users', { params }),
  publications: (params) => api.get('/reporting/publications', { params }),
  validations: (params) => api.get('/reporting/validations', { params }),
  exportPDF: (params) => api.get('/reporting/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reporting/export/excel', { params, responseType: 'blob' }),
};

export const auditAPI = {
  list: (params) => api.get('/audit', { params }),
  getById: (id) => api.get(`/audit/${id}`),
};
