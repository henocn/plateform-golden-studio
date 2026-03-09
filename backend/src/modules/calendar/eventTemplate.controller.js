'use strict';

const eventTemplateService = require('./eventTemplate.service');
const ApiResponse = require('../../utils/ApiResponse');

// Commentaire: liste les templates d'événements
async function list(req, res, next) {
  try {
    const items = await eventTemplateService.list();
    return ApiResponse.success(res, items, 'Templates d’événements récupérés');
  } catch (error) {
    return next(error);
  }
}

// Commentaire: crée un nouveau template d'événement
async function create(req, res, next) {
  try {
    const tpl = await eventTemplateService.create(req.body, req.user);
    return ApiResponse.created(res, tpl, 'Template d’événement créé');
  } catch (error) {
    return next(error);
  }
}

// Commentaire: met à jour un template d'événement
async function update(req, res, next) {
  try {
    const tpl = await eventTemplateService.update(req.params.id, req.body);
    return ApiResponse.success(res, tpl, 'Template d’événement mis à jour');
  } catch (error) {
    return next(error);
  }
}

// Commentaire: supprime un template d'événement
async function remove(req, res, next) {
  try {
    await eventTemplateService.delete(req.params.id);
    return ApiResponse.noContent(res);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};

