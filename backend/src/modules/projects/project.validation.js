'use strict';

const Joi = require('joi');

const createProjectSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  agency_direction: Joi.string().max(255).optional().allow(null, ''),
  internal_manager_id: Joi.string().uuid().optional().allow(null),
  studio_manager_id: Joi.string().uuid().optional().allow(null),
  client_contact_id: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  status: Joi.string().valid('draft', 'in_progress', 'pending_validation', 'completed', 'archived').default('draft'),
  target_date: Joi.date().iso().optional().allow(null),
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  agency_direction: Joi.string().max(255).optional().allow(null, ''),
  internal_manager_id: Joi.string().uuid().optional().allow(null),
  studio_manager_id: Joi.string().uuid().optional().allow(null),
  client_contact_id: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  target_date: Joi.date().iso().optional().allow(null),
}).min(1);

const patchStatusSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'in_progress', 'pending_validation', 'completed', 'archived')
    .required(),
});

const listProjectQuery = Joi.object({
  status: Joi.string().valid('draft', 'in_progress', 'pending_validation', 'completed', 'archived').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  organizationId: Joi.string().uuid().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  patchStatusSchema,
  listProjectQuery,
};
