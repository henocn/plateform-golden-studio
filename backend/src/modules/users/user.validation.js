'use strict';

const Joi = require('joi');

const INTERNAL_ROLES = ['super_admin', 'admin', 'validator', 'contributor', 'reader'];
const CLIENT_ROLES = ['client_admin', 'client_validator', 'client_contributor', 'client_reader'];

const createInternalUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, and digit',
  }),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid(...INTERNAL_ROLES).required(),
  job_title: Joi.string().max(100).optional().allow(null, ''),
  contact: Joi.string().max(255).optional().allow(null, ''),
});

const createClientUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, and digit',
  }),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid(...CLIENT_ROLES).required(),
  job_title: Joi.string().max(100).optional().allow(null, ''),
  contact: Joi.string().max(255).optional().allow(null, ''),
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  job_title: Joi.string().max(100).optional().allow(null, ''),
  phone: Joi.string().max(50).optional().allow(null, ''),
  contact: Joi.string().max(255).optional().allow(null, ''),
  avatar_path: Joi.string().max(500).optional().allow(null, ''),
}).min(1);

const changeRoleSchema = Joi.object({
  role: Joi.string().required().messages({
    'any.required': 'Role is required',
  }),
});

const patchStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

const listUsersQuery = Joi.object({
  search: Joi.string().max(255).optional(),
  role: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const notificationSettingsSchema = Joi.object({
  email_enabled: Joi.boolean().optional(),
  tasks_enabled: Joi.boolean().optional(),
  validations_enabled: Joi.boolean().optional(),
  events_enabled: Joi.boolean().optional(),
  weekly_summary_enabled: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createInternalUserSchema,
  createClientUserSchema,
  updateUserSchema,
  changeRoleSchema,
  patchStatusSchema,
  listUsersQuery,
  notificationSettingsSchema,
};
