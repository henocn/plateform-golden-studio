'use strict';

const Joi = require('joi');

const createOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Organization name must be at least 2 characters',
    'any.required': 'Organization name is required',
  }),
  short_name: Joi.string().min(1).max(50).optional().allow(null, ''),
  type: Joi.string()
    .valid('ministry', 'agency', 'public_enterprise', 'institution', 'other')
    .required()
    .messages({
      'any.only': 'Type must be one of: ministry, agency, public_enterprise, institution, other',
      'any.required': 'Organization type is required',
    }),
  logo_path: Joi.string().max(500).optional().allow(null, ''),
  contact_email: Joi.string().email().optional().allow(null, ''),
  contact_phone: Joi.string().max(30).optional().allow(null, ''),
  address: Joi.string().max(500).optional().allow(null, ''),
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  short_name: Joi.string().min(1).max(50).optional().allow(null, ''),
  type: Joi.string()
    .valid('ministry', 'agency', 'public_enterprise', 'institution', 'other')
    .optional(),
  logo_path: Joi.string().max(500).optional().allow(null, ''),
  contact_email: Joi.string().email().optional().allow(null, ''),
  contact_phone: Joi.string().max(30).optional().allow(null, ''),
  address: Joi.string().max(500).optional().allow(null, ''),
}).min(0);

const patchStatusSchema = Joi.object({
  is_active: Joi.boolean().required().messages({
    'any.required': 'is_active is required',
  }),
});

const listOrganizationQuery = Joi.object({
  type: Joi.string()
    .valid('ministry', 'agency', 'public_enterprise', 'institution', 'other')
    .optional(),
  is_active: Joi.boolean().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
  patchStatusSchema,
  listOrganizationQuery,
};
