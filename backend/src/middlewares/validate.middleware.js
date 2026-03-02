'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Generic Joi validation middleware factory.
 *
 * @param {Object} schema  Joi schema object (required)
 * @param {'body'|'query'|'params'} source  Request property to validate (default: 'body')
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.post('/projects', validate(createProjectSchema), controller.create);
 *   router.get('/projects', validate(projectQuerySchema, 'query'), controller.list);
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const dataToValidate = req[source];

  const { error, value } = schema.validate(dataToValidate, {
    abortEarly: false,       // Return ALL errors, not just the first
    stripUnknown: true,      // Remove unknown fields
    convert: true,           // Type coercion (e.g. string → number for query params)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(ApiError.validationError('Erreur de validation', details));
  }

  // Replace source with sanitized/validated values
  // Node.js 24+ defines req.query as a read-only getter on IncomingMessage,
  // so direct assignment (req.query = value) throws. Use defineProperty to shadow it.
  Object.defineProperty(req, source, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return next();
};

module.exports = validate;
