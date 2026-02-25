'use strict';

const Joi = require('joi');

const createPublicationSchema = Joi.object({
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').required(),
  link: Joi.string().uri().max(500).optional().allow(null, ''),
  archive_path: Joi.string().max(500).optional().allow(null, ''),
});

const updatePublicationSchema = Joi.object({
  proposal_id: Joi.string().uuid().optional().allow(null),
  task_id: Joi.string().uuid().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  channel: Joi.string().valid('facebook', 'linkedin', 'official_release', 'website', 'tv', 'radio', 'other').optional(),
  link: Joi.string().uri().max(500).optional().allow(null, ''),
  archive_path: Joi.string().max(500).optional().allow(null, ''),
}).min(1);

module.exports = {
  createPublicationSchema,
  updatePublicationSchema,
};
