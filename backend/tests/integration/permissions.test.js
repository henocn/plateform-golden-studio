'use strict';

const request = require('supertest');
const app = require('../../src/app');

const API = '/api/v1';

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

const SUPER_ADMIN = { email: 'admin@goldenstudio.com', password: 'Admin@1234' };
const CONTRIBUTOR = { email: 'creator@goldenstudio.com', password: 'Creator@1234' };
const CLIENT_READER = { email: 'lecteur@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_ADMIN = { email: 'admin@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_VALIDATOR = { email: 'validateur@mipise.gov.dz', password: 'Client@1234' };

describe('Permissions Integration Tests', () => {
  let superAdminToken;
  let contributorToken;
  let clientReaderToken;
  let clientAdminToken;

  beforeAll(async () => {
    superAdminToken = (await loginAs(SUPER_ADMIN)).token;
    contributorToken = (await loginAs(CONTRIBUTOR)).token;
    clientReaderToken = (await loginAs(CLIENT_READER)).token;
    clientAdminToken = (await loginAs(CLIENT_ADMIN)).token;
  });

  describe('Organizations — internal only', () => {
    test('super_admin CAN list organizations', async () => {
      await request(app)
        .get(`${API}/organizations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    test('client_reader CANNOT list organizations', async () => {
      const res = await request(app)
        .get(`${API}/organizations`)
        .set('Authorization', `Bearer ${clientReaderToken}`);

      // Should be 403 (forbidden)
      expect([403]).toContain(res.statusCode);
    });

    test('client_admin CANNOT list organizations', async () => {
      const res = await request(app)
        .get(`${API}/organizations`)
        .set('Authorization', `Bearer ${clientAdminToken}`);

      expect([403]).toContain(res.statusCode);
    });
  });

  describe('Projects — role-based access', () => {
    test('contributor CAN view projects', async () => {
      await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);
    });

    test('client_reader CAN view own org projects', async () => {
      await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${clientReaderToken}`)
        .expect(200);
    });

    test('client_reader CANNOT create a project', async () => {
      const res = await request(app)
        .post(`${API}/projects`)
        .set('Authorization', `Bearer ${clientReaderToken}`)
        .send({ title: 'Test' });

      expect([403]).toContain(res.statusCode);
    });
  });

  describe('Audit — admin+ only', () => {
    test('super_admin CAN access audit logs', async () => {
      await request(app)
        .get(`${API}/audit`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    test('contributor CANNOT access audit logs', async () => {
      const res = await request(app)
        .get(`${API}/audit`)
        .set('Authorization', `Bearer ${contributorToken}`);

      expect([403]).toContain(res.statusCode);
    });

    test('client_admin CANNOT access audit logs', async () => {
      const res = await request(app)
        .get(`${API}/audit`)
        .set('Authorization', `Bearer ${clientAdminToken}`);

      expect([403]).toContain(res.statusCode);
    });
  });

  describe('Reporting — admin+ / own org', () => {
    test('super_admin CAN access global reporting', async () => {
      await request(app)
        .get(`${API}/reporting/overview`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    test('client_admin CAN access own org reporting', async () => {
      await request(app)
        .get(`${API}/reporting/overview`)
        .set('Authorization', `Bearer ${clientAdminToken}`)
        .expect(200);
    });
  });

  describe('Proposals — client_reader cannot validate', () => {
    test('client_reader CANNOT submit a validation', async () => {
      // Use first seeded project and proposal
      // Try to validate — should be denied by role
      const projectsRes = await request(app)
        .get(`${API}/projects`)
        .set('Authorization', `Bearer ${clientReaderToken}`)
        .expect(200);

      const projects = projectsRes.body.data.data || projectsRes.body.data;
      if (Array.isArray(projects) && projects.length > 0) {
        const projectId = projects[0].id;

        const proposalsRes = await request(app)
          .get(`${API}/projects/${projectId}/proposals`)
          .set('Authorization', `Bearer ${clientReaderToken}`)
          .expect(200);

        const proposals = proposalsRes.body.data;
        if (Array.isArray(proposals) && proposals.length > 0) {
          const proposalId = proposals[0].id;
          const res = await request(app)
            .post(`${API}/projects/${projectId}/proposals/${proposalId}/validate`)
            .set('Authorization', `Bearer ${clientReaderToken}`)
            .send({ status: 'approved', comments: 'ok' });

          expect([403]).toContain(res.statusCode);
        }
      }
    });
  });
});
