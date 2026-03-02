'use strict';

const agencyService = require('./agency.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const data = await agencyService.list();
    return ApiResponse.success(res, data);
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await agencyService.getById(req.params.id);
    return ApiResponse.success(res, data);
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await agencyService.create(req.body);
    return ApiResponse.created(res, data, 'Agence créée');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await agencyService.update(req.params.id, req.body);
    return ApiResponse.success(res, data, 'Agence mise à jour');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await agencyService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Agence supprimée');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getById, create, update, remove };
