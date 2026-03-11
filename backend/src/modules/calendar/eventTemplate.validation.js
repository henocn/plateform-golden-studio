'use strict';

const Joi = require('joi');

// Commentaire: statuts possibles pour les tâches de template d'événement
const EVENT_TASK_STATUS = ['pending', 'in_progress', 'done'];

// Commentaire: schéma d'une tâche dans un template d'événement
const templateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).optional().allow(null, ''),
  status: Joi.string().valid(...EVENT_TASK_STATUS).default('pending'),
  responsible_user_id: Joi.string().uuid().optional().allow(null, ''),
});

// Commentaire: schéma de création de template d'événement (sans description)
const createEventTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  tasks: Joi.array().items(templateTaskSchema).optional().default([]),
});

// Commentaire: schéma de mise à jour de template d'événement
const updateEventTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  tasks: Joi.array().items(templateTaskSchema).optional(),
}).min(1);

module.exports = {
  createEventTemplateSchema,
  updateEventTemplateSchema,
};


