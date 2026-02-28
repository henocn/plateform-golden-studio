'use strict';

const request = require('supertest');
const app = require('../../src/app');

const API = '/api/v1';

// Seeded test accounts
const SUPER_ADMIN = { email: 'admin@goldenstudio.com', password: 'Admin@1234' };
const ADMIN = { email: 'manager@goldenstudio.com', password: 'Manager@1234' };
const VALIDATOR = { email: 'validator@goldenstudio.com', password: 'Validator@1234' };
const CONTRIBUTOR = { email: 'creator@goldenstudio.com', password: 'Creator@1234' };
const CLIENT_ADMIN_MIPISE = { email: 'admin@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_VALIDATOR_MIPISE = { email: 'validateur@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_READER_MIPISE = { email: 'lecteur@mipise.gov.dz', password: 'Client@1234' };
const CLIENT_ADMIN_APIZF = { email: 'admin@api-zf.gov.dz', password: 'Client@1234' };

/**
 * Helper: login and return { token, user, refreshToken }
 */
async function loginAs(credentials) {
  const res = await request(app)
    .post(`${API}/auth/login`)
    .send(credentials)
    .expect(200);

  expect(res.body.success).toBe(true);
  return {
    token: res.body.data.access_token,
    refreshToken: res.body.data.refresh_token,
    user: res.body.data.user,
  };
}

describe('Auth Integration Tests', () => {
  describe('POST /auth/login', () => {
    test('should login super_admin successfully', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send(SUPER_ADMIN)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');
      expect(res.body.data.user.email).toBe(SUPER_ADMIN.email);
      expect(res.body.data.user.user_type).toBe('internal');
      expect(res.body.data.user.role).toBe('super_admin');
    });

    test('should login client_admin successfully', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send(CLIENT_ADMIN_MIPISE)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.user_type).toBe('client');
      expect(res.body.data.user.role).toBe('client_admin');
      expect(res.body.data.user).not.toHaveProperty('organization_id');
    });

    test('should reject invalid password', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: SUPER_ADMIN.email, password: 'WrongPassword1' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject unknown email', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'nobody@test.com', password: 'SomePassword1' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject missing fields (422 validation)', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({})
        .expect(422);

      expect(res.body.success).toBe(false);
    });

    test('should reject password too short (Joi)', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'a@b.com', password: 'short' })
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh tokens successfully', async () => {
      const { refreshToken } = await loginAs(SUPER_ADMIN);

      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');
      expect(res.body.data.refresh_token).not.toBe(refreshToken);
    });

    test('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refresh_token: 'invalid-token-value-here' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject already-used refresh token (rotation)', async () => {
      const { refreshToken } = await loginAs(ADMIN);

      // Use once
      await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Reuse should fail
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refresh_token: refreshToken })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user profile', async () => {
      const { token } = await loginAs(SUPER_ADMIN);

      const res = await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const user = res.body.data.user || res.body.data;
      expect(user.email).toBe(SUPER_ADMIN.email);
      expect(user).not.toHaveProperty('password_hash');
    });

    test('should reject without token', async () => {
      await request(app)
        .get(`${API}/auth/me`)
        .expect(401);
    });

    test('should reject invalid token', async () => {
      await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout and revoke refresh token', async () => {
      const { token, refreshToken } = await loginAs(CONTRIBUTOR);

      await request(app)
        .post(`${API}/auth/logout`)
        .set('Authorization', `Bearer ${token}`)
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Refresh token should no longer work
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refresh_token: refreshToken })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/change-password', () => {
    test('should reject wrong current password', async () => {
      const { token } = await loginAs(VALIDATOR);

      const res = await request(app)
        .post(`${API}/auth/change-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'WrongPassword12',
          new_password: 'NewPassword@1234',
          confirm_password: 'NewPassword@1234',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});

module.exports = { loginAs, API, SUPER_ADMIN, ADMIN, VALIDATOR, CONTRIBUTOR, CLIENT_ADMIN_MIPISE, CLIENT_VALIDATOR_MIPISE, CLIENT_READER_MIPISE, CLIENT_ADMIN_APIZF };
