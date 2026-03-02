'use strict';

const Joi = require('joi');

const listAuditQuery = Joi.object({
  userId: Joi.string().uuid().optional(),
  action: Joi.string().max(100).optional(),
  entityType: Joi.string().max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { listAuditQuery };
