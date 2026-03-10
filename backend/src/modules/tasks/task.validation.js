'use strict';

const Joi = require('joi');

const createTaskSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  assigned_to: Joi.string().uuid().optional().allow(null),
  supervisor_id: Joi.string().uuid().optional().allow(null),
  due_date: Joi.date().iso().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().valid('todo', 'in_production', 'done', 'blocked', 'cancelled').default('todo'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  context: Joi.string().valid('project', 'event').default('project'),
  event_id: Joi.string().uuid().optional().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  assigned_to: Joi.string().uuid().optional().allow(null),
  supervisor_id: Joi.string().uuid().optional().allow(null),
  due_date: Joi.date().iso().optional().allow(null),
  publication_date: Joi.date().iso().optional().allow(null),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  context: Joi.string().valid('project', 'event').optional(),
  event_id: Joi.string().uuid().optional().allow(null),
}).min(1);

const patchTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('todo', 'in_production', 'done', 'blocked', 'cancelled')
    .required(),
});

const listTaskQuery = Joi.object({
  projectId: Joi.string().uuid().optional(),
  assignee: Joi.string().uuid().optional(),
  status: Joi.string().valid('todo', 'in_production', 'done', 'blocked', 'cancelled').optional(),
  overdue: Joi.boolean().optional(),
  urgent: Joi.boolean().optional(),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  patchTaskStatusSchema,
  listTaskQuery,
  createCommentSchema,
};
