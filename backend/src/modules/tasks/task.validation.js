'use strict';

const Joi = require('joi');

const createTaskSchema = Joi.object({
  project_id: Joi.string().uuid().optional().allow(null),
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
}).custom((value, helpers) => {
  const ctx = value.context || 'project';

  // Pour les tâches de projet, un project_id est requis
  if (ctx === 'project' && !value.project_id) {
    return helpers.error('any.custom', { message: 'project_id est requis pour une tâche de projet' });
  }

  const due = value.due_date ? new Date(value.due_date) : null;
  const pub = value.publication_date ? new Date(value.publication_date) : null;

  // Si les deux sont renseignées, publication_date doit être strictement postérieure à due_date
  if (due && pub && !(pub > due)) {
    return helpers.error('any.custom', { message: 'La date de publication doit être postérieure à la date limite.' });
  }

  return value;
}, 'project_id and dates validation for tasks');

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
}).min(1).custom((value, helpers) => {
  const due = value.due_date ? new Date(value.due_date) : null;
  const pub = value.publication_date ? new Date(value.publication_date) : null;

  if (due && pub && !(pub > due)) {
    return helpers.error('any.custom', { message: 'La date de publication doit être postérieure à la date limite.' });
  }

  return value;
}, 'dates validation for task update');

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
