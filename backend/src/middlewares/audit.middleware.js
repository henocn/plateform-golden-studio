'use strict';

const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Audit middleware — automatically logs mutations (POST/PUT/PATCH/DELETE).
 * Fire-and-forget: does NOT block the response.
 *
 * Attaches itself as an `on('finish')` callback so it logs AFTER the response.
 *
 * Usage:
 *   router.post('/projects', authenticate, audit('PROJECT_CREATED', 'project'), controller.create);
 *
 * Or apply globally to mutating routes:
 *   app.use('/api/v1', auditAll);
 */

/**
 * Targeted audit middleware for a specific action/entity.
 *
 * @param {string} action       The action label (e.g. 'PROJECT_CREATED', 'USER_UPDATED')
 * @param {string} entityType   The entity type (e.g. 'project', 'user')
 */
const audit = (action, entityType) => (req, res, next) => {
  // Hook into response finish to capture entityId from response body
  res.on('finish', () => {
    // Only log mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;

    // Fire-and-forget
    setImmediate(async () => {
      try {
        const entityId = req.params.id || (res.locals.createdId) || null;

        await AuditLog.create({
          user_id: req.user ? req.user.id : null,
          action,
          entity_type: entityType,
          entity_id: entityId,
          old_value: res.locals.oldValue || null,
          new_value: res.locals.newValue || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent') || null,
        });
      } catch (error) {
        // NEVER fail the request due to audit logging
        logger.error('Audit log write failed', { error: error.message, action, entityType });
      }
    });
  });

  next();
};

/**
 * Global audit middleware — auto-detects action from HTTP method + path.
 * Apply to all API routes for blanket audit coverage.
 */
const auditAll = (req, res, next) => {
  // Only intercept mutations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  res.on('finish', () => {
    // Only log successful mutations (2xx)
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    setImmediate(async () => {
      try {
        // Derive action from method
        const methodMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'PARTIAL_UPDATE', DELETE: 'DELETE' };
        const action = methodMap[req.method] || req.method;

        // Derive entity type from route path  e.g. /api/v1/projects/123 → projects
        const pathParts = req.path.split('/').filter(Boolean);
        const entityType = pathParts[0] || 'unknown';

        await AuditLog.create({
          user_id: req.user ? req.user.id : null,
          action: `${entityType.toUpperCase()}_${action}`,
          entity_type: entityType,
          entity_id: req.params.id || null,
          old_value: res.locals.oldValue || null,
          new_value: res.locals.newValue || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent') || null,
        });
      } catch (error) {
        logger.error('Audit log (global) write failed', { error: error.message });
      }
    });
  });

  return next();
};

module.exports = { audit, auditAll };
