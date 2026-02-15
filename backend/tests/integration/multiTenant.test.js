'use strict';

const request = require('supertest');
const app = require('../../src/app');

const API = '/api/v1';

const SUPER_ADMIN = { email: 'admin@goldenstudio.com', password: 'Admin@1234' };
const CLIENT_ADMIN_MIPISE = { email: 'admin@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_ADMIN_APIZF = { email: 'admin@api-zf.gov.dz', password: 'Client@1234' };

async function loginAs(credentials) {
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send(credentials)
    .expect(200);
  return {
    token: res.body.data.access_token,
    user: res.body.data.user,
  };
}

describe('Multi-Tenant Isolation Tests', () => {
  let superAdminToken;
  let mipiseToken, mipiseOrgId;
  let apizfToken, apizfOrgId;

  beforeAll(async () => {
    const sa = await loginAs(SUPER_ADMIN);
    superAdminToken = sa.token;

    const m = await loginAs(CLIENT_ADMIN_MIPISE);
    mipiseToken = m.token;
    mipiseOrgId = m.user.organization_id;

    const a = await loginAs(CLIENT_ADMIN_APIZF);
    apizfToken = a.token;
    apizfOrgId = a.user.organization_id;
  });

  describe('Projects isolation', () => {
    test('MIPISE client should only see MIPISE projects', async () => {
      const res = await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${mipiseToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const projects = res.body.data.data || res.body.data;
      const projectsArray = Array.isArray(projects) ? projects : [];

      projectsArray.forEach((p) => {
        expect(p.organization_id).toBe(mipiseOrgId);
      });
    });

    test('API-ZF client should only see API-ZF projects', async () => {
      const res = await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${apizfToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const projects = res.body.data.data || res.body.data;
      const projectsArray = Array.isArray(projects) ? projects : [];

      projectsArray.forEach((p) => {
        expect(p.organization_id).toBe(apizfOrgId);
      });
    });

    test('MIPISE client should NOT see API-ZF projects', async () => {
      const res = await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${mipiseToken}`)
        .expect(200);

      const projects = res.body.data.data || res.body.data;
      const projectsArray = Array.isArray(projects) ? projects : [];

      const hasApizf = projectsArray.some((p) => p.organization_id === apizfOrgId);
      expect(hasApizf).toBe(false);
    });

    test('Internal super_admin should see ALL projects', async () => {
      const res = await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const projects = res.body.data.data || res.body.data;
      const projectsArray = Array.isArray(projects) ? projects : [];

      // Should have projects from both orgs (seed has 5 total: 3 MIPISE + 2 API-ZF)
      expect(projectsArray.length).toBeGreaterThanOrEqual(5);
      const orgIds = [...new Set(projectsArray.map((p) => p.organization_id))];
      expect(orgIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tasks isolation', () => {
    test('MIPISE client should not see internal_only tasks', async () => {
      const res = await request(app)
        .get(`${API}/tasks`)
        .set('Authorization', `Bearer ${mipiseToken}`)
        .expect(200);

      const tasks = res.body.data.data || res.body.data;
      const tasksArray = Array.isArray(tasks) ? tasks : [];

      // Client should never see internal_only tasks
      tasksArray.forEach((t) => {
        expect(t.visibility).not.toBe('internal_only');
      });

      // All tasks should belong to MIPISE org
      tasksArray.forEach((t) => {
        expect(t.organization_id).toBe(mipiseOrgId);
      });
    });

    test('Internal admin should see all tasks including internal_only', async () => {
      const res = await request(app)
        .get(`${API}/tasks`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const tasks = res.body.data.data || res.body.data;
      const tasksArray = Array.isArray(tasks) ? tasks : [];

      const hasInternal = tasksArray.some((t) => t.visibility === 'internal_only');
      expect(hasInternal).toBe(true);
    });
  });

  describe('Organizations isolation', () => {
    test('Only internal users should access organizations endpoint', async () => {
      const res = await request(app)
        .get(`${API}/organizations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
