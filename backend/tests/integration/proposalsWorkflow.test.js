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

const CONTRIBUTOR = { email: 'creator@goldenstudio.com', password: 'Creator@1234' };
const VALIDATOR_INTERNAL = { email: 'validator@goldenstudio.com', password: 'Validator@1234' };
const CLIENT_VALIDATOR = { email: 'validateur@mipise.gov.dz', password: 'Client@1234' };

describe('Proposals Workflow Integration Tests', () => {
  let contributorToken;
  let validatorToken;
  let clientValidatorToken;
  let testProjectId;

  beforeAll(async () => {
    contributorToken = (await loginAs(CONTRIBUTOR)).token;
    validatorToken = (await loginAs(VALIDATOR_INTERNAL)).token;
    const cv = await loginAs(CLIENT_VALIDATOR);
    clientValidatorToken = cv.token;

    // Get a MIPISE project to work with
    const res = await request(app)
      .get(`${API}/projects`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200);

    const projects = res.body.data.data || res.body.data;
    // Find a MIPISE project (client_validator belongs to MIPISE)
    testProjectId = Array.isArray(projects) && projects.length > 0 ? projects[0].id : null;
  });

  test('should have a test project', () => {
    expect(testProjectId).toBeDefined();
    expect(testProjectId).not.toBeNull();
  });

  describe('Full workflow: draft → submit → client validate', () => {
    let proposalId;

    test('1. Contributor creates a draft proposal', async () => {
      const res = await request(app)
        .post(`${API}/projects/${testProjectId}/proposals`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          title: 'Test Proposal Workflow',
          description: 'Proposal created by integration test for workflow validation',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.title).toBe('Test Proposal Workflow');
      proposalId = res.body.data.id;
    });

    test('2. Draft proposal can be updated', async () => {
      const res = await request(app)
        .put(`${API}/projects/${testProjectId}/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          title: 'Test Proposal Workflow — Updated',
          description: 'Updated description',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Proposal Workflow — Updated');
    });

    test('3. Internal validator submits proposal to client', async () => {
      const res = await request(app)
        .patch(`${API}/projects/${testProjectId}/proposals/${proposalId}/submit`)
        .set('Authorization', `Bearer ${validatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_client_validation');
    });

    test('4. After submission, proposal cannot be edited', async () => {
      const res = await request(app)
        .put(`${API}/projects/${testProjectId}/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ title: 'Should fail', description: 'nope' });

      // Should fail because status is not draft
      expect([400, 422]).toContain(res.statusCode);
    });

    test('5. Add a comment on the proposal (internal)', async () => {
      const res = await request(app)
        .post(`${API}/projects/${testProjectId}/proposals/${proposalId}/comments`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ content: 'Internal comment on proposal' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.is_internal).toBe(true);
    });

    test('6. Client validator can see the proposal', async () => {
      const res = await request(app)
        .get(`${API}/projects/${testProjectId}/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${clientValidatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending_client_validation');
    });

    test('7. Client validator approves the proposal', async () => {
      const res = await request(app)
        .post(`${API}/projects/${testProjectId}/proposals/${proposalId}/validate`)
        .set('Authorization', `Bearer ${clientValidatorToken}`)
        .send({ status: 'approved', comments: 'Looks great, approved!' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    test('8. Proposal should now be approved', async () => {
      const res = await request(app)
        .get(`${API}/projects/${testProjectId}/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('approved');
    });

    test('9. Validation history should exist', async () => {
      const res = await request(app)
        .get(`${API}/projects/${testProjectId}/proposals/${proposalId}/validations`)
        .set('Authorization', `Bearer ${validatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const validations = res.body.data;
      expect(Array.isArray(validations)).toBe(true);
      expect(validations.length).toBeGreaterThanOrEqual(1);
      expect(validations.some((v) => v.status === 'approved')).toBe(true);
    });
  });
});
