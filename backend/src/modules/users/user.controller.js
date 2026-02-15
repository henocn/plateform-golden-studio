'use strict';

const userService = require('./user.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

/**
 * GET /api/v1/users/internal
 */
const listInternal = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await userService.listInternal({
      search: req.query.search,
      role: req.query.role,
      is_active: req.query.is_active,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Internal users retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/users/internal
 */
const createInternal = async (req, res, next) => {
  try {
    const user = await userService.createInternal(req.body, req.user.id);
    return ApiResponse.created(res, user, 'Internal user created successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/users/internal/:id/role
 */
const changeInternalRole = async (req, res, next) => {
  try {
    const user = await userService.changeInternalRole(req.params.id, req.body.role);
    return ApiResponse.success(res, user, 'Internal user role updated');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/users/clients
 */
const listClients = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await userService.listClients({
      tenantId: req.tenantId,
      search: req.query.search,
      role: req.query.role,
      is_active: req.query.is_active,
      organizationId: req.query.organizationId,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Client users retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/users/clients
 */
const createClient = async (req, res, next) => {
  try {
    const user = await userService.createClient(req.body, req.user);
    return ApiResponse.created(res, user, 'Client user created successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/users/clients/:id/role
 */
const changeClientRole = async (req, res, next) => {
  try {
    const user = await userService.changeClientRole(req.params.id, req.body.role, req.user);
    return ApiResponse.success(res, user, 'Client user role updated');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/users/:id
 */
const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    return ApiResponse.success(res, user, 'User retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/users/:id
 */
const update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, user, 'User updated successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/status
 */
const patchStatus = async (req, res, next) => {
  try {
    const user = await userService.updateStatus(req.params.id, req.body.is_active, req.user);
    return ApiResponse.success(res, user, `User ${req.body.is_active ? 'activated' : 'deactivated'}`);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    await userService.delete(req.params.id, req.user);
    return ApiResponse.success(res, null, 'User deactivated');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listInternal,
  createInternal,
  changeInternalRole,
  listClients,
  createClient,
  changeClientRole,
  getById,
  update,
  patchStatus,
  deleteUser,
};
