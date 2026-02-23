'use strict';

const Joi = require('joi');

const createFolderSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  parent_id: Joi.string().uuid().optional().allow(null),
  organization_id: Joi.string().uuid().optional(),
  is_global: Joi.boolean().optional(),
});

const updateFolderSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  parent_id: Joi.string().uuid().optional().allow(null),
  organization_id: Joi.string().uuid().optional(),
  is_global: Joi.boolean().optional(),
}).min(1);

const listFolderQuery = Joi.object({
  parent_id: Joi.string().uuid().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createFolderSchema,
  updateFolderSchema,
  listFolderQuery,
};
