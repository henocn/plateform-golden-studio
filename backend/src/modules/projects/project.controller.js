'use strict';

const projectService = require('./project.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await projectService.list({
      tenantId: req.tenantId,
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Projects retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const project = await projectService.create(req.body, req.user.id);
    return ApiResponse.created(res, project, 'Project created successfully');
  } catch (error) {
    return next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await projectService.getDashboardStats(req.tenantId);
    return ApiResponse.success(res, stats, 'Dashboard stats retrieved');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id, req.tenantId);
    return ApiResponse.success(res, project, 'Project retrieved');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.update(req.params.id, req.body, req.tenantId);
    return ApiResponse.success(res, project, 'Project updated successfully');
  } catch (error) {
    return next(error);
  }
};

const patchStatus = async (req, res, next) => {
  try {
    const project = await projectService.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, project, 'Project status updated');
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await projectService.archive(req.params.id);
    return ApiResponse.success(res, null, 'Project archived');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, create, getDashboardStats, getById, update, patchStatus, deleteProject };
