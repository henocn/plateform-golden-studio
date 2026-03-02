'use strict';

const Joi = require('joi');

const createEditorialSchema = Joi.object({
  publication_title: Joi.string().max(500).optional().allow(null, ''),
  project_id: Joi.string().uuid().optional().allow(null),
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  networks: Joi.array().items(Joi.string().max(120)).optional(),
  network_links: Joi.object().pattern(Joi.string(), Joi.string().uri().allow('')).optional(),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').default('other'),
  status: Joi.string().valid('scheduled', 'published', 'draft', 'archived').default('scheduled'),
  notes: Joi.string().max(5000).optional().allow(null, ''),
});

const updateEditorialSchema = Joi.object({
  publication_title: Joi.string().max(500).optional().allow(null, ''),
  project_id: Joi.string().uuid().optional().allow(null),
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  networks: Joi.array().items(Joi.string().max(120)).optional(),
  network_links: Joi.object().pattern(Joi.string(), Joi.string().uri().allow('')).optional(),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').optional(),
  status: Joi.string().valid('scheduled', 'published', 'draft', 'archived').optional(),
  notes: Joi.string().max(5000).optional().allow(null, ''),
}).min(1);

const assignEditorialTaskSchema = Joi.object({
  task_id: Joi.string().uuid().required(),
});

const listEditorialQuery = Joi.object({
  projectId: Joi.string().uuid().optional(),
  taskId: Joi.string().uuid().optional(),
  status: Joi.string().valid('scheduled', 'published', 'draft', 'archived').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  createEditorialSchema,
  updateEditorialSchema,
  assignEditorialTaskSchema,
  listEditorialQuery,
};

