'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Complete permissions matrix — from proposition.md §6
 */
const PERMISSIONS = {
  // ─── Backoffice interne Golden Studio ──────────────────────
  'projects.create':            ['super_admin', 'admin', 'contributor'],
  'projects.edit':              ['super_admin', 'admin', 'contributor'],
  'projects.delete':            ['super_admin', 'admin'],
  'projects.view_all_orgs':     ['super_admin', 'admin', 'validator', 'contributor', 'reader'],
  'proposals.create':           ['super_admin', 'admin', 'contributor'],
  'proposals.submit_to_client': ['super_admin', 'admin', 'validator'],
  'validations.internal':       ['super_admin', 'admin', 'validator'],
  'users.manage_internal':      ['super_admin'],
  'users.manage_clients':       ['super_admin', 'admin'],
  'organizations.manage':       ['super_admin'],
  'reporting.global':           ['super_admin', 'admin'],
  'audit.view':                 ['super_admin', 'admin'],
  'mediatheque.upload':         ['super_admin', 'admin', 'contributor'],
  'tasks.create':               ['super_admin', 'admin', 'contributor'],
  'tasks.edit':                 ['super_admin', 'admin', 'contributor'],
  'tasks.delete':               ['super_admin', 'admin'],
  'publications.manage':        ['super_admin', 'admin', 'contributor'],
  'calendar.manage':            ['super_admin', 'admin', 'contributor'],
  'briefs.create':              ['super_admin', 'admin', 'contributor'],
  'briefs.edit':                ['super_admin', 'admin', 'contributor'],

  // ─── Portail client (always scoped to their organization_id) ─
  'projects.view_own':          ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'briefs.submit':              ['client_admin', 'client_contributor'],
  'proposals.validate_client':  ['client_admin', 'client_validator'],
  'tasks.comment':              ['client_admin', 'client_validator', 'client_contributor'],
  'calendar.view':              ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'mediatheque.view':           ['client_admin', 'client_validator', 'client_contributor', 'client_reader'],
  'users.manage_own_org':       ['client_admin'],
  'reporting.own_org':          ['client_admin'],
};

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
