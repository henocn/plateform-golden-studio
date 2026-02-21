'use strict';

const folderService = require('./folder.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await folderService.list({
      tenantId: req.tenantId,
      search: req.query.search,
      parent_id: req.query.parent_id,
      page, limit, offset,
    }, req.user);
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Folders retrieved');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const folder = await folderService.getById(req.params.id, req.user);
    return ApiResponse.success(res, folder, 'Folder retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const folder = await folderService.create(req.body, req.user);
    return ApiResponse.created(res, folder, 'Folder created');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const folder = await folderService.update(req.params.id, req.body);
    return ApiResponse.success(res, folder, 'Folder updated');
  } catch (error) {
    return next(error);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    await folderService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Folder deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  deleteFolder,
};
