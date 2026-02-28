'use strict';

const Joi = require('joi');

const createProjectSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  agency_direction: Joi.string().max(255).optional().allow(null, ''),
  internal_manager_id: Joi.string().uuid().optional().allow(null),
  studio_manager_id: Joi.string().uuid().optional().allow(null),
  client_contact_id: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  status: Joi.string().valid('brief_received', 'in_production', 'in_validation', 'published', 'archived').default('brief_received'),
  target_date: Joi.date().iso().optional().allow(null),
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  agency_direction: Joi.string().max(255).optional().allow(null, ''),
  internal_manager_id: Joi.string().uuid().optional().allow(null),
  studio_manager_id: Joi.string().uuid().optional().allow(null),
  client_contact_id: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  target_date: Joi.date().iso().optional().allow(null),
}).min(1);

const patchStatusSchema = Joi.object({
  status: Joi.string()
    .valid('brief_received', 'in_production', 'in_validation', 'published', 'archived')
    .required(),
});

const listProjectQuery = Joi.object({
  status: Joi.string().valid('brief_received', 'in_production', 'in_validation', 'published', 'archived').optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
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
