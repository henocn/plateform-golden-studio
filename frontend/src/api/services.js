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

const API_BASE = '/api/v1';

export const organizationsAPI = {
  getCurrent: () => api.get('/organizations/current'),
  list: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  updateWithLogo: (id, formData) => api.put(`/organizations/${id}`, formData),
  delete: (id) => api.delete(`/organizations/${id}`),
  patchStatus: (id, data) => api.patch(`/organizations/${id}/status`, data),
  getUsers: (id, params) => api.get(`/organizations/${id}/users`, { params }),
  getProjects: (id, params) => api.get(`/organizations/${id}/projects`, { params }),
  getStats: (id) => api.get(`/organizations/${id}/stats`),
};

/** URL pour un fichier uploadé (ex: logo organisation). */
export function uploadsUrl(relativePath) {
  if (!relativePath) return null;
  return `${API_BASE}/uploads/${String(relativePath).replace(/^\/+/, '')}`;
}

export const usersAPI = {
  listMembers: (params) => api.get('/users/members', { params }),
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
  list: (projectId, params) => api.get(`/projects/${projectId}/briefs`, { params }),
  getById: (projectId, id) => api.get(`/projects/${projectId}/briefs/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/briefs`, data),
  update: (projectId, id, data) => api.put(`/projects/${projectId}/briefs/${id}`, data),
  addAttachment: (projectId, id, formData) =>
    api.post(`/projects/${projectId}/briefs/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeAttachment: (projectId, id, attachId) => api.delete(`/projects/${projectId}/briefs/${id}/attachments/${attachId}`),
};

export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getProposals: (id) => api.get(`/tasks/${id}/proposals`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  patchStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
  getComments: (id) => api.get(`/tasks/${id}/comments`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  removeComment: (id, cid) => api.delete(`/tasks/${id}/comments/${cid}`),
};

export const proposalsAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/proposals`, { params }),
  getById: (projectId, id) => api.get(`/projects/${projectId}/proposals/${id}`),
  download: (projectId, id) => api.get(`/projects/${projectId}/proposals/${id}/download`, { responseType: 'blob' }),
  saveToMedia: (projectId, id, data) => api.post(`/projects/${projectId}/proposals/${id}/save-to-media`, data),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/proposals`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  update: (projectId, id, data) => api.put(`/projects/${projectId}/proposals/${id}`, data),
  submit: (projectId, id) => api.patch(`/projects/${projectId}/proposals/${id}/submit`),
  getComments: (projectId, id) => api.get(`/projects/${projectId}/proposals/${id}/comments`),
  addComment: (projectId, id, data) => api.post(`/projects/${projectId}/proposals/${id}/comments`, data),
  validate: (projectId, id, data) => api.post(`/projects/${projectId}/proposals/${id}/validate`, data),
  getValidations: (projectId, id) => api.get(`/projects/${projectId}/proposals/${id}/validations`),
};

export const publicationsAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/publications`, { params }),
  getById: (projectId, id) => api.get(`/projects/${projectId}/publications/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/publications`, data),
  update: (projectId, id, data) => api.put(`/projects/${projectId}/publications/${id}`, data),
  remove: (projectId, id) => api.delete(`/projects/${projectId}/publications/${id}`),
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

export const foldersAPI = {
  list: (params) => api.get('/folders', { params }),
  getRootFolders: (organizationId) =>
    organizationId ? api.get(`/folders/roots/${organizationId}`) : api.get('/folders/roots'),
  explore: (id) => api.get(`/folders/${id}/explore`),
  getById: (id) => api.get(`/folders/${id}`),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.put(`/folders/${id}`, data),
  remove: (id) => api.delete(`/folders/${id}`),
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
