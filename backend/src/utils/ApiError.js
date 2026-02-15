'use strict';

/**
 * Classe d'erreur métier personnalisée
 *
 * Format de sortie :
 * {
 *   success: false,
 *   error: {
 *     code: "UNAUTHORIZED_ORG_ACCESS",
 *     message: "Vous n'avez pas accès à cette organisation",
 *     details: []
 *   }
 * }
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory methods ───────────────────────────────────────

  static badRequest(message = 'Bad request', details = []) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static invalidCredentials(message = 'Invalid email or password') {
    return new ApiError(401, 'INVALID_CREDENTIALS', message);
  }

  static tokenExpired(message = 'Token expired') {
    return new ApiError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static insufficientRole(message = 'Insufficient role for this action') {
    return new ApiError(403, 'INSUFFICIENT_ROLE', message);
  }

  static unauthorizedOrgAccess(message = 'You do not have access to this organization') {
    return new ApiError(403, 'UNAUTHORIZED_ORG_ACCESS', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'RESOURCE_NOT_FOUND', message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static validationError(message = 'Validation error', details = []) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static proposalNotSubmittable(message = 'Proposal is not in a submittable state') {
    return new ApiError(422, 'PROPOSAL_NOT_SUBMITTABLE', message);
  }

  static validationAlreadyExists(message = 'Validation already submitted for this proposal') {
    return new ApiError(409, 'VALIDATION_ALREADY_EXISTS', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  /**
   * Sérialisation pour la réponse HTTP
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

module.exports = ApiError;
