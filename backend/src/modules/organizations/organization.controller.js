"use strict";

const organizationService = require("./organization.service");
const ApiResponse = require("../../utils/ApiResponse");
const {
  parsePagination,
  buildPaginationMeta,
} = require("../../utils/pagination");

/**
 * GET /api/v1/organizations
 */
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const filters = {
      type: req.query.type,
      is_active: req.query.is_active,
      search: req.query.search,
      page,
      limit,
      offset,
    };

    const { data, total } = await organizationService.list(filters);
    const meta = buildPaginationMeta(page, limit, total);

    return ApiResponse.success(res, { data, meta }, "Organizations retrieved");
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/organizations
 */
const create = async (req, res, next) => {
  try {
    const organization = await organizationService.create(
      req.body,
      req.user.id,
    );
    return ApiResponse.created(
      res,
      organization,
      "Organization created successfully",
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/organizations/:id
 */
const getById = async (req, res, next) => {
  try {
    const organization = await organizationService.getById(req.params.id);
    return ApiResponse.success(res, organization, "Organization retrieved");
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/organizations/:id
 */
const update = async (req, res, next) => {
  try {
    const organization = await organizationService.update(
      req.params.id,
      req.body,
    );
    return ApiResponse.success(
      res,
      organization,
      "Organization updated successfully",
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/organizations/:id/status
 */
const patchStatus = async (req, res, next) => {
  try {
    const organization = await organizationService.updateStatus(
      req.params.id,
      req.body.is_active,
    );
    return ApiResponse.success(
      res,
      organization,
      `Organization ${req.body.is_active ? "activated" : "deactivated"} successfully`,
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/organizations/:id/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await organizationService.getUsers(req.params.id, {
      page,
      limit,
      offset,
    });
    const meta = buildPaginationMeta(page, limit, total);

    return ApiResponse.success(
      res,
      { data, meta },
      "Organization users retrieved",
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/organizations/:id/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await organizationService.getProjects(
      req.params.id,
      { page, limit, offset },
    );
    const meta = buildPaginationMeta(page, limit, total);

    return ApiResponse.success(
      res,
      { data, meta },
      "Organization projects retrieved",
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/organizations/:id/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await organizationService.getStats(req.params.id);
    return ApiResponse.success(res, stats, "Organization stats retrieved");
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/organizations/:id
 */
const remove = async (req, res, next) => {
  try {
    await organizationService.remove(req.params.id);
    return ApiResponse.success(res, null, "Organization deleted successfully");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  patchStatus,
  getUsers,
  getProjects,
  getStats,
  remove,
};
