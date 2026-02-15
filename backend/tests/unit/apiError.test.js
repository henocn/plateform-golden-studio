'use strict';

const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  test('should create an error with all properties', () => {
    const err = new ApiError(400, 'TEST_CODE', 'Test message', [{ field: 'x' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('Test message');
    expect(err.details).toEqual([{ field: 'x' }]);
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('ApiError');
  });

  test('should default details to empty array', () => {
    const err = new ApiError(500, 'ERR', 'msg');
    expect(err.details).toEqual([]);
  });

  test('.badRequest()', () => {
    const err = ApiError.badRequest('bad');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('bad');
  });

  test('.badRequest() with details', () => {
    const details = [{ field: 'email', message: 'required' }];
    const err = ApiError.badRequest('Validation failed', details);
    expect(err.details).toEqual(details);
  });

  test('.unauthorized()', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  test('.invalidCredentials()', () => {
    const err = ApiError.invalidCredentials();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('INVALID_CREDENTIALS');
  });

  test('.tokenExpired()', () => {
    const err = ApiError.tokenExpired();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_EXPIRED');
  });

  test('.forbidden()', () => {
    const err = ApiError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  test('.insufficientRole()', () => {
    const err = ApiError.insufficientRole();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('INSUFFICIENT_ROLE');
  });

  test('.unauthorizedOrgAccess()', () => {
    const err = ApiError.unauthorizedOrgAccess();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('UNAUTHORIZED_ORG_ACCESS');
  });

  test('.notFound()', () => {
    const err = ApiError.notFound('Project');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('RESOURCE_NOT_FOUND');
    expect(err.message).toBe('Project');
  });

  test('.conflict()', () => {
    const err = ApiError.conflict();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  test('.validationError()', () => {
    const err = ApiError.validationError('err', [{ field: 'x' }]);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual([{ field: 'x' }]);
  });

  test('.proposalNotSubmittable()', () => {
    const err = ApiError.proposalNotSubmittable();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('PROPOSAL_NOT_SUBMITTABLE');
  });

  test('.validationAlreadyExists()', () => {
    const err = ApiError.validationAlreadyExists();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('VALIDATION_ALREADY_EXISTS');
  });

  test('.internal()', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  test('.toJSON() returns formatted error response', () => {
    const err = new ApiError(400, 'CODE', 'msg', ['detail']);
    const json = err.toJSON();
    expect(json).toEqual({
      success: false,
      error: {
        code: 'CODE',
        message: 'msg',
        details: ['detail'],
      },
    });
  });

  test('should capture stack trace', () => {
    const err = ApiError.badRequest('test');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('ApiError');
  });
});
