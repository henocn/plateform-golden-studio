'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Authentication middleware — verifies JWT access token and attaches req.user
 */
const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Le jeton d’accès est requis');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Attach user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
      role: decoded.role,
      organization_id: decoded.organization_id,
    };

    return next();
  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.tokenExpired());
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Jeton d’authentification invalide'));
    }
    logger.error('Auth middleware error', { error: error.message });
    return next(ApiError.unauthorized('Échec de l’authentification'));
  }
};

/**
 * Optional authentication — attaches req.user if token is present, but does not fail
 */
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
      role: decoded.role,
      organization_id: decoded.organization_id,
    };
  } catch (_err) {
    // Silently ignore — user just won't be attached
  }
  return next();
};

module.exports = { authenticate, optionalAuth };
