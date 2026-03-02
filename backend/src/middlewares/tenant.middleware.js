'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Tenant middleware — mode mono-organisation.
 * Conservé pour compatibilité de la chaîne de middlewares,
 * mais ne fait plus de filtrage par organization_id.
 */
const tenantMiddleware = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentification requise'));
    }

    req.tenantId = null;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = tenantMiddleware;
