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

  static badRequest(message = 'Mauvaise requête', details = []) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Non autorisé') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static invalidCredentials(message = 'Email ou mot de passe invalide') {
    return new ApiError(401, 'INVALID_CREDENTIALS', message);
  }

  static tokenExpired(message = 'Session expirée, veuillez vous reconnecter') {
    return new ApiError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'Accès interdit à cette ressource') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static insufficientRole(message = 'Rôle insuffisant pour cette action') {
    return new ApiError(403, 'INSUFFICIENT_ROLE', message);
  }

  static unauthorizedOrgAccess(message = 'Vous n\'avez pas accès à cette organisation') {
    return new ApiError(403, 'UNAUTHORIZED_ORG_ACCESS', message);
  }

  static notFound(message = 'Ressource non trouvée') {
    return new ApiError(404, 'RESOURCE_NOT_FOUND', message);
  }

  static conflict(message = 'Conflit') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static validationError(message = 'Erreur de validation', details = []) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static proposalNotSubmittable(message = 'La proposition n\'est pas dans un état soumis') {
    return new ApiError(422, 'PROPOSAL_NOT_SUBMITTABLE', message);
  }

  static validationAlreadyExists(message = 'Une validation a déjà été soumise pour cette proposition') {
    return new ApiError(409, 'VALIDATION_ALREADY_EXISTS', message);
  }

  static internal(message = 'Erreur interne du serveur') {
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
