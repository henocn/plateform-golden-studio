'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Permissions matrix — loaded from config/permissions.js
 * Pour modifier les accès, éditez UNIQUEMENT le fichier config/permissions.js
 */
const PERMISSIONS = require('../config/permissions');

/**
 * Middleware factory — authorize(...permissions)
 *
 * Checks whether req.user.role is listed in the allowed roles
 * for ANY of the given permissions.
 *
 * @param  {...string} requiredPermissions  One or more permission keys
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.post('/projects', authenticate, authorize('projects.create'), projectController.create);
 */
const authorize = (...requiredPermissions) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const { role } = req.user;

  // Check if the user's role is authorized for at least one of the required permissions
  const isAuthorized = requiredPermissions.some((permission) => {
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      // Unknown permission → deny by default
      return false;
    }
    return allowedRoles.includes(role);
  });

  if (!isAuthorized) {
    return next(ApiError.insufficientRole());
  }

  return next();
};

/**
 * Restrict route to internal users only.
 */
const internalOnly = (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (req.user.user_type !== 'internal') {
    return next(ApiError.forbidden('This resource is restricted to internal users'));
  }
  return next();
};

/**
 * Restrict route to client users only.
 */
const clientOnly = (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (req.user.user_type !== 'client') {
    return next(ApiError.forbidden('This resource is restricted to client users'));
  }
  return next();
};

module.exports = {
  PERMISSIONS,
  authorize,
  internalOnly,
  clientOnly,
};
