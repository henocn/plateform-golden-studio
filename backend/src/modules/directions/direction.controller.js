'use strict';

const directionService = require('./direction.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const agencyId = req.query.agency_id;
    const data = await directionService.list({ agency_id: agencyId });
    return ApiResponse.success(res, data);
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await directionService.getById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await directionService.create(req.body);
    return ApiResponse.created(res, data, 'Direction créée');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await directionService.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Direction mise à jour');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await directionService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Direction supprimée');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getById, create, update, remove };
