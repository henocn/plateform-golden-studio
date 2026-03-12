'use strict';

'use strict';

const path = require('path');
const userService = require('./user.service');
const { User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const env = require('../../config/env');

/**
 * GET /api/v1/users/members
 * Lightweight endpoint returning id + name + role for assignment dropdowns.
 * Available to any internal user.
 */
const listMembers = async (req, res, next) => {
  try {
    const type = req.query.type; // 'internal' | 'client' | undefined (all)
    const where = { is_active: true };
    if (type === 'internal') where.user_type = 'internal';
    else if (type === 'client') where.user_type = 'client';

    const users = await User.findAll({
      where,
      attributes: ['id', 'first_name', 'last_name', 'role', 'user_type'],
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
    return ApiResponse.success(res, { data: users, meta: { total: users.length } }, 'Membres récupérés');
  } catch (error) {
    return next(error);
  }
};

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
    return ApiResponse.success(res, { data, meta }, 'Utilisateurs internes récupérés');
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
    return ApiResponse.created(res, user, 'Utilisateur interne créé avec succès');
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
    return ApiResponse.success(res, user, "Rôle de l'utilisateur interne mis à jour");
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
      search: req.query.search,
      role: req.query.role,
      is_active: req.query.is_active,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Utilisateurs clients récupérés');
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
    return ApiResponse.created(res, user, 'Utilisateur client créé avec succès');
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
    return ApiResponse.success(res, user, "Rôle de l'utilisateur client mis à jour");
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
    return ApiResponse.success(res, user, 'Utilisateur récupéré');
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
    return ApiResponse.success(res, user, 'Utilisateur mis à jour avec succès');
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/users/:id/avatar
 * Update user avatar (current user or managed by admins)
 */
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return next(ApiError.badRequest('Aucun fichier téléchargé'));
    }

    const relative = path
      .relative(env.UPLOAD_DIR, req.file.path)
      .split(path.sep)
      .join('/');

    const user = await userService.update(
      req.params.id,
      { avatar_path: relative },
      req.user,
    );

    return ApiResponse.success(res, user, 'Photo de profil mise à jour avec succès');
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
    return ApiResponse.success(
      res,
      user,
      `Utilisateur ${req.body.is_active ? 'activé' : 'désactivé'}`,
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/users/me/notifications
 */
const updateNotificationSettings = async (req, res, next) => {
  try {
    const user = await userService.updateNotificationSettings(req.user.id, req.body);
    return ApiResponse.success(res, user, 'Préférences de notifications mises à jour');
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
    return ApiResponse.success(res, null, 'Utilisateur désactivé');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMembers,
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
  updateAvatar,
  updateNotificationSettings,
};
