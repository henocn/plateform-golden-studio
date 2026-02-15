'use strict';

const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Centralized error handler middleware.
 *
 * This can replace the inline error handler in app.js, or complement it.
 * It formats all errors into the standard ApiError JSON format.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  // ─── ApiError (operational / business error) ────────────
  if (err.isOperational) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // ─── Sequelize Validation / Unique Constraint ───────────
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors
      ? err.errors.map((e) => ({ field: e.path, message: e.message }))
      : [];
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation error',
        details,
      },
    });
  }

  // ─── Sequelize Foreign Key Constraint ───────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_ERROR',
        message: 'Referenced resource does not exist or cannot be deleted due to dependencies',
        details: [{ field: err.fields ? err.fields.join(', ') : 'unknown' }],
      },
    });
  }

  // ─── JSON Web Token Errors ──────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        details: [],
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        details: [],
      },
    });
  }

  // ─── Multer Errors ──────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds the maximum limit',
        details: [],
      },
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TOO_MANY_FILES',
        message: 'Too many files uploaded',
        details: [],
      },
    });
  }

  // ─── Unexpected Error (500) ─────────────────────────────
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      details: [],
    },
  });
};

module.exports = errorHandler;
