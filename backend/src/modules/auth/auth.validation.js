'use strict';

const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).optional().messages({
    'string.length': 'TOTP code must be exactly 6 digits',
    'string.pattern.base': 'TOTP code must contain only digits',
  }),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const logoutSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one digit',
      'any.required': 'New password is required',
    }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
});

const enable2FASchema = Joi.object({
  // No body required — the secret is generated server-side
});

const verify2FASchema = Joi.object({
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'TOTP code must be exactly 6 digits',
    'string.pattern.base': 'TOTP code must contain only digits',
    'any.required': 'TOTP code is required',
  }),
});

const disable2FASchema = Joi.object({
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'TOTP code must be exactly 6 digits',
    'string.pattern.base': 'TOTP code must contain only digits',
    'any.required': 'TOTP code is required to disable 2FA',
  }),
});

module.exports = {
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
};
