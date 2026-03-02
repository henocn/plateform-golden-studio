'use strict';

const tenantMiddleware = require('../../src/middlewares/tenant.middleware');

// Crée des objets req/res/next simulés pour les tests
function mockReqResNext(user) {
  const req = { user, query: {} };
  const res = {};
  const errors = [];
  const next = (err) => { if (err) errors.push(err); };
  return { req, res, next, errors };
}

describe('Tenant Middleware (single-organization)', () => {
  test('should set tenantId to null for any authenticated user', async () => {
    const user = { user_type: 'internal', role: 'admin' };
    const { req, res, next } = mockReqResNext(user);
    await tenantMiddleware(req, res, next);
    expect(req.tenantId).toBeNull();
  });

  test('should set tenantId to null for client users', async () => {
    const user = { user_type: 'client', role: 'client_admin' };
    const { req, res, next } = mockReqResNext(user);
    await tenantMiddleware(req, res, next);
    expect(req.tenantId).toBeNull();
  });

  test('should return error if no user attached', async () => {
    const { req, res, next, errors } = mockReqResNext(null);
    await tenantMiddleware(req, res, next);
    expect(errors.length).toBe(1);
  });
});
