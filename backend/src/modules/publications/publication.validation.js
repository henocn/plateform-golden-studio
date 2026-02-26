'use strict';

const Joi = require('joi');

const createPublicationSchema = Joi.object({
  project_id: Joi.string().uuid().optional().allow(null),
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  publication_title: Joi.string().max(255).optional().allow(null, ''),
  publisher_name: Joi.string().max(255).optional().allow(null, ''),
  networks: Joi.array().items(Joi.string().max(120)).optional(),
  publication_lines: Joi.array().items(Joi.string().max(120)).optional(),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').required(),
  link: Joi.string().uri().max(500).optional().allow(null, ''),
  archive_path: Joi.string().max(500).optional().allow(null, ''),
  status: Joi.string().valid('scheduled', 'published', 'draft', 'archived').optional(),
  notes: Joi.string().max(5000).optional().allow(null, ''),
});

const updatePublicationSchema = Joi.object({
  project_id: Joi.string().uuid().optional().allow(null),
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  publication_title: Joi.string().max(255).optional().allow(null, ''),
  publisher_name: Joi.string().max(255).optional().allow(null, ''),
  networks: Joi.array().items(Joi.string().max(120)).optional(),
  publication_lines: Joi.array().items(Joi.string().max(120)).optional(),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').optional(),
  link: Joi.string().uri().max(500).optional().allow(null, ''),
  archive_path: Joi.string().max(500).optional().allow(null, ''),
  status: Joi.string().valid('scheduled', 'published', 'draft', 'archived').optional(),
  notes: Joi.string().max(5000).optional().allow(null, ''),
}).min(1);

module.exports = {
  createPublicationSchema,
  updatePublicationSchema,
};
