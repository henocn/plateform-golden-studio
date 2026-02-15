'use strict';

const briefService = require('./brief.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const briefs = await briefService.listByProject(req.params.projectId, req.tenantId);
    return ApiResponse.success(res, briefs, 'Briefs retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const brief = await briefService.create(req.params.projectId, req.body, req.user);
    return ApiResponse.created(res, brief, 'Brief created successfully');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const brief = await briefService.update(req.params.id, req.body, req.tenantId);
    return ApiResponse.success(res, brief, 'Brief updated successfully');
  } catch (error) {
    return next(error);
  }
};

const addAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.success(res, null, 'No file uploaded', 400);
    }
    const attachment = await briefService.addAttachment(req.params.id, req.file, req.user);
    return ApiResponse.created(res, attachment, 'Attachment uploaded');
  } catch (error) {
    return next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    await briefService.deleteAttachment(req.params.attachId);
    return ApiResponse.success(res, null, 'Attachment deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, create, update, addAttachment, deleteAttachment };
