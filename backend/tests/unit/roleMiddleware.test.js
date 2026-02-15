'use strict';

const { authorize, internalOnly, clientOnly, PERMISSIONS } = require('../../src/middlewares/role.middleware');
const ApiError = require('../../src/utils/ApiError');

// Helper to create mock req/res/next
const mockReqResNext = (user = null) => {
  const req = { user };
  const res = {};
  const errors = [];
  const next = jest.fn((err) => { if (err) errors.push(err); });
  return { req, res, next, errors };
};

describe('Role middleware', () => {
  describe('PERMISSIONS matrix', () => {
    test('should contain expected permission keys', () => {
      expect(PERMISSIONS['projects.create']).toBeDefined();
      expect(PERMISSIONS['organizations.manage']).toBeDefined();
      expect(PERMISSIONS['users.manage_internal']).toBeDefined();
      expect(PERMISSIONS['proposals.validate_client']).toBeDefined();
      expect(PERMISSIONS['reporting.global']).toBeDefined();
      expect(PERMISSIONS['audit.view']).toBeDefined();
    });

    test('super_admin should be in organizations.manage', () => {
      expect(PERMISSIONS['organizations.manage']).toContain('super_admin');
    });

    test('admin should NOT be in organizations.manage', () => {
      expect(PERMISSIONS['organizations.manage']).not.toContain('admin');
    });

    test('only super_admin can manage internal users', () => {
      expect(PERMISSIONS['users.manage_internal']).toEqual(['super_admin']);
    });

    test('client roles should have projects.view_own', () => {
      const roles = PERMISSIONS['projects.view_own'];
      expect(roles).toContain('client_admin');
      expect(roles).toContain('client_validator');
      expect(roles).toContain('client_contributor');
      expect(roles).toContain('client_reader');
    });

    test('client_reader should NOT have briefs.submit', () => {
      expect(PERMISSIONS['briefs.submit']).not.toContain('client_reader');
    });
  });

  describe('authorize()', () => {
    test('should call next() when user has required permission', () => {
      const { req, res, next } = mockReqResNext({ role: 'super_admin', user_type: 'internal' });
      authorize('organizations.manage')(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('should call next(ApiError) when user lacks permission', () => {
      const { req, res, next, errors } = mockReqResNext({ role: 'contributor', user_type: 'internal' });
      authorize('organizations.manage')(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0]).toBeInstanceOf(ApiError);
      expect(errors[0].statusCode).toBe(403);
      expect(errors[0].code).toBe('INSUFFICIENT_ROLE');
    });

    test('should pass if user has ANY of the required permissions', () => {
      const { req, res, next } = mockReqResNext({ role: 'client_admin', user_type: 'client' });
      authorize('projects.view_all_orgs', 'projects.view_own')(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('should deny if user has NONE of the required permissions', () => {
      const { req, res, next, errors } = mockReqResNext({ role: 'client_reader', user_type: 'client' });
      authorize('proposals.create', 'proposals.submit_to_client')(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('INSUFFICIENT_ROLE');
    });

    test('should deny if req.user is null', () => {
      const { req, res, next, errors } = mockReqResNext(null);
      authorize('projects.view_all_orgs')(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(401);
    });

    test('should deny unknown permission (not in PERMISSIONS)', () => {
      const { req, res, next, errors } = mockReqResNext({ role: 'super_admin' });
      authorize('unknown.permission')(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].code).toBe('INSUFFICIENT_ROLE');
    });
  });

  describe('internalOnly()', () => {
    test('should pass for internal user', () => {
      const { req, res, next } = mockReqResNext({ user_type: 'internal' });
      internalOnly(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('should deny client user', () => {
      const { req, res, next, errors } = mockReqResNext({ user_type: 'client' });
      internalOnly(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(403);
    });

    test('should deny if req.user is null', () => {
      const { req, res, next, errors } = mockReqResNext(null);
      internalOnly(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(401);
    });
  });

  describe('clientOnly()', () => {
    test('should pass for client user', () => {
      const { req, res, next } = mockReqResNext({ user_type: 'client' });
      clientOnly(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('should deny internal user', () => {
      const { req, res, next, errors } = mockReqResNext({ user_type: 'internal' });
      clientOnly(req, res, next);
      expect(errors.length).toBe(1);
      expect(errors[0].statusCode).toBe(403);
    });
  });
});
