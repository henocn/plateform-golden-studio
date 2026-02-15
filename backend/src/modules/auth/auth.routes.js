'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../../config/env');
const { authenticate } = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  verify2FASchema,
  disable2FASchema,
} = require('./auth.validation');

const router = Router();

// ─── Validate middleware (inline helper) ─────────────────────
const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const ApiError = require('../../utils/ApiError');
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(ApiError.validationError(details));
  }
  req.body = value;
  return next();
};

// ─── Auth Rate Limiter (strict: 5 req / 15 min) ─────────────
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
      details: [],
    },
  },
});

// ─── Public Routes ──────────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/2fa/verify', authLimiter, validate(verify2FASchema), authController.verify2FA);

// ─── Protected Routes ───────────────────────────────────────
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/2fa/enable', authenticate, authController.enable2FA);
router.post('/2fa/disable', authenticate, validate(disable2FASchema), authController.disable2FA);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
