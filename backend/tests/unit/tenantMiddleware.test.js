'use strict';

const ApiError = require('../../src/utils/ApiError');

// We test tenant middleware with mocked Organization model
jest.mock('../../src/models', () => ({
  Organization: {
    findByPk: jest.fn(),
  },
}));

const { Organization } = require('../../src/models');
const tenantMiddleware = require('../../src/middlewares/tenant.middleware');

const mockReqResNext = (user, query = {}) => {
  const req = { user, query };
  const res = {};
  const errors = [];
  const next = jest.fn((err) => { if (err) errors.push(err); });
  return { req, res, next, errors };
};

describe('Tenant middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if req.user is missing', async () => {
    const { req, res, next, errors } = mockReqResNext(null);
    await tenantMiddleware(req, res, next);
    expect(errors.length).toBe(1);
    expect(errors[0].statusCode).toBe(401);
  });

  describe('Client users', () => {
    test('should force tenantId to client organization_id', async () => {
      const user = { user_type: 'client', organization_id: 'org-123' };
      const { req, res, next } = mockReqResNext(user);
      await tenantMiddleware(req, res, next);
      expect(req.tenantId).toBe('org-123');
      expect(next).toHaveBeenCalledWith();
    });

    test('should deny client without organization_id', async () => {
      const user = { user_type: 'client', organization_id: null };
      const { req, res, next, errors } = mockReqResNext(user);
      await tenantMiddleware(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(401);
    });

    test('should ignore organizationId query param for clients', async () => {
      const user = { user_type: 'client', organization_id: 'org-FORCED' };
      const { req, res, next } = mockReqResNext(user, { organizationId: 'org-OTHER' });
      await tenantMiddleware(req, res, next);
      expect(req.tenantId).toBe('org-FORCED');
    });
  });

  describe('Internal users', () => {
    test('should set tenantId to null when no organizationId', async () => {
      const user = { user_type: 'internal' };
      const { req, res, next } = mockReqResNext(user);
      await tenantMiddleware(req, res, next);
      expect(req.tenantId).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    test('should set tenantId when valid organizationId is provided', async () => {
      Organization.findByPk.mockResolvedValue({ id: 'org-123' });
      const user = { user_type: 'internal' };
      const { req, res, next } = mockReqResNext(user, { organizationId: 'org-123' });
      await tenantMiddleware(req, res, next);
      expect(req.tenantId).toBe('org-123');
      expect(Organization.findByPk).toHaveBeenCalledWith('org-123', { attributes: ['id'] });
    });

    test('should return 404 when organizationId does not exist', async () => {
      Organization.findByPk.mockResolvedValue(null);
      const user = { user_type: 'internal' };
      const { req, res, next, errors } = mockReqResNext(user, { organizationId: 'bad-org' });
      await tenantMiddleware(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(404);
    });
  });
});
