'use strict';

const Joi = require('joi');

const createBriefSchema = Joi.object({
  description: Joi.string().min(5).max(10000).required(),
  objective: Joi.string().max(5000).optional().allow(null, ''),
  target_audience: Joi.string().max(5000).optional().allow(null, ''),
  key_message: Joi.string().max(5000).optional().allow(null, ''),
  deadline: Joi.date().iso().optional().allow(null),
});

const updateBriefSchema = Joi.object({
  description: Joi.string().min(5).max(10000).optional(),
  objective: Joi.string().max(5000).optional().allow(null, ''),
  target_audience: Joi.string().max(5000).optional().allow(null, ''),
  key_message: Joi.string().max(5000).optional().allow(null, ''),
  deadline: Joi.date().iso().optional().allow(null),
}).min(1);

module.exports = {
  createBriefSchema,
  updateBriefSchema,
};
