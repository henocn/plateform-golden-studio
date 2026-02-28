'use strict';

const Joi = require('joi');

const createMediaSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  type: Joi.string().valid('logo', 'graphic_charter', 'video', 'photo', 'template', 'document', 'other').required(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional().default([]),
  is_global: Joi.boolean().default(false),
  folder_id: Joi.string().uuid().optional().allow(null),
});

const updateMediaSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  type: Joi.string().valid('logo', 'graphic_charter', 'video', 'photo', 'template', 'document', 'other').optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  is_global: Joi.boolean().optional(),
  folder_id: Joi.string().uuid().optional().allow(null),
}).min(1);

const listMediaQuery = Joi.object({
  type: Joi.string().valid('logo', 'graphic_charter', 'video', 'photo', 'template', 'document', 'other').optional(),
  is_global: Joi.boolean().optional(),
  search: Joi.string().max(255).optional(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  folder_id: Joi.string().uuid().optional().allow(null, ''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createMediaSchema,
  updateMediaSchema,
  listMediaQuery,
};
