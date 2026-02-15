'use strict';

const { Organization } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Tenant isolation middleware.
 * Runs AFTER auth.middleware (req.user must exist).
 *
 * - client users → req.tenantId = their own organization_id (forced, immutable)
 * - internal users → req.tenantId = req.query.organizationId || null (voluntary filter)
 */
const tenantMiddleware = async (req, _res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (req.user.user_type === 'client') {
      // Client users are ALWAYS scoped to their own organization
      req.tenantId = req.user.organization_id;

      if (!req.tenantId) {
        return next(ApiError.unauthorized('Client user must belong to an organization'));
      }
    } else if (req.user.user_type === 'internal') {
      // Internal users can optionally scope to a specific organization
      const { organizationId } = req.query;

      if (organizationId) {
        // Validate that the organization exists
        const org = await Organization.findByPk(organizationId, {
          attributes: ['id'],
        });
        if (!org) {
          return next(ApiError.notFound('Organization'));
        }
        req.tenantId = organizationId;
      } else {
        // No filter — global access (backoffice view)
        req.tenantId = null;
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = tenantMiddleware;
