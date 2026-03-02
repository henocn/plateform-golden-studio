'use strict';

const Joi = require('joi');

const EVENT_STATUS = ['pending', 'in_progress', 'done', 'cancelled'];
const EVENT_TASK_STATUS = ['pending', 'in_progress', 'done'];

const taskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  status: Joi.string().valid(...EVENT_TASK_STATUS).default('pending'),
  responsible: Joi.string().max(255).optional().allow(null, ''),
});

const createEventSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid(...EVENT_STATUS).default('pending'),
  description: Joi.string().max(5000).optional().allow(null, ''),
  agency_id: Joi.string().uuid().optional().allow(null),
  direction_id: Joi.string().uuid().optional().allow(null),
  tasks: Joi.array().items(taskSchema).optional().default([]),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional().allow(null),
  description: Joi.string().max(5000).optional().allow(null, ''),
  status: Joi.string().valid(...EVENT_STATUS).optional(),
  agency_id: Joi.string().uuid().optional().allow(null),
  direction_id: Joi.string().uuid().optional().allow(null),
  tasks: Joi.array().items(taskSchema).optional(),
}).min(1);

const patchEventStatusSchema = Joi.object({
  status: Joi.string().valid(...EVENT_STATUS).required(),
});

const listEventQuery = Joi.object({
  status: Joi.string().valid(...EVENT_STATUS).optional(),
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
