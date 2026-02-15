'use strict';

const auditService = require('./audit.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await auditService.list({
      userId: req.query.userId,
      organizationId: req.query.organizationId,
      action: req.query.action,
      entityType: req.query.entityType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Audit logs retrieved');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const log = await auditService.getById(req.params.id);
    return ApiResponse.success(res, log, 'Audit log retrieved');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, getById };
