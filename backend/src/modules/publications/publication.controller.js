'use strict';

const publicationService = require('./publication.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const pubs = await publicationService.listByProject(req.params.projectId, req.tenantId);
    return ApiResponse.success(res, pubs, 'Publications retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const pub = await publicationService.create(req.params.projectId, req.body, req.user);
    return ApiResponse.created(res, pub, 'Publication created');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const pub = await publicationService.update(req.params.id, req.body);
    return ApiResponse.success(res, pub, 'Publication updated');
  } catch (error) {
    return next(error);
  }
};

const deletePublication = async (req, res, next) => {
  try {
    await publicationService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Publication deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, create, update, deletePublication };
