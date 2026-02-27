'use strict';

const { Organization } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Tenant middleware en mode mono-organisation.
 * Runs AFTER auth.middleware (req.user must exist).
 *
 * - utilisateurs client → req.tenantId = leur organization_id (obligatoire)
 * - utilisateurs internes → req.tenantId = null (vue globale backoffice)
 */
const tenantMiddleware = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentification requise'));
    }

    if (req.user.user_type === 'client') {
      // Client users are ALWAYS scoped to their own organization
      req.tenantId = req.user.organization_id;

      if (!req.tenantId) {
        return next(ApiError.unauthorized('L’utilisateur client doit appartenir à une organisation'));
      }
    } else if (req.user.user_type === 'internal') {
      // Internal users: vue globale unique (une seule organisation)
      req.tenantId = null;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = tenantMiddleware;
