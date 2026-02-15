'use strict';

const Joi = require('joi');

const createProposalSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional().allow(null, ''),
  description: Joi.string().max(10000).optional().allow(null, ''),
  file_path: Joi.string().max(500).optional().allow(null, ''),
});

const updateProposalSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(10000).optional().allow(null, ''),
  file_path: Joi.string().max(500).optional().allow(null, ''),
}).min(1);

const validateProposalSchema = Joi.object({
  status: Joi.string().valid('approved', 'needs_revision', 'rejected').required(),
  comments: Joi.string().max(5000).optional().allow(null, ''),
});

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

module.exports = {
  createProposalSchema,
  updateProposalSchema,
  validateProposalSchema,
  createCommentSchema,
};
