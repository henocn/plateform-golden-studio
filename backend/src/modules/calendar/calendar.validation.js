'use strict';

const Joi = require('joi');

const createEventSchema = Joi.object({
  organization_id: Joi.string().uuid().optional().allow(null),
  project_id: Joi.string().uuid().optional().allow(null),
  title: Joi.string().min(2).max(255).required(),
  type: Joi.string().valid('event_coverage', 'meeting', 'other').required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid('pending', 'validated', 'scheduled', 'published', 'cancelled').default('pending'),
  description: Joi.string().max(5000).optional().allow(null, ''),
  visibility: Joi.string().valid('internal_only', 'client_visible').default('client_visible'),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  type: Joi.string().valid('event_coverage', 'meeting', 'other').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional().allow(null),
  description: Joi.string().max(5000).optional().allow(null, ''),
  visibility: Joi.string().valid('internal_only', 'client_visible').optional(),
}).min(1);

const patchEventStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'validated', 'scheduled', 'published', 'cancelled').required(),
});

const listEventQuery = Joi.object({
  type: Joi.string().valid('event_coverage', 'meeting', 'other').optional(),
  projectId: Joi.string().uuid().optional(),
  organizationId: Joi.string().uuid().optional(),
  status: Joi.string().valid('pending', 'validated', 'scheduled', 'published', 'cancelled').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  patchEventStatusSchema,
  listEventQuery,
};
