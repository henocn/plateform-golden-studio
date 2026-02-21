'use strict';

const folderService = require('./folder.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

/**
 * Liste les dossiers avec filtrage
 */
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await folderService.list({
      search: req.query.search,
      parent_id: req.query.parent_id,
      page, limit, offset,
    }, req.user, req.tenantId);
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Folders retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * Récupère les dossiers racine d'une organisation
 */
const getRootFolders = async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId || req.query.organizationId || req.user.organization_id;
    const folders = await folderService.getRootFolders(organizationId, req.user, req.tenantId);
    return ApiResponse.success(res, folders, 'Root folders retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * Explore un dossier : retourne sous-dossiers + fichiers
 */
const explore = async (req, res, next) => {
  try {
    const result = await folderService.explore(req.params.id, req.user, req.tenantId);
    return ApiResponse.success(res, result, 'Folder explored');
  } catch (error) {
    return next(error);
  }
};

/**
 * Récupère un dossier par son ID
 */
const getById = async (req, res, next) => {
  try {
    const folder = await folderService.getById(req.params.id, req.user, req.tenantId);
    return ApiResponse.success(res, folder, 'Folder retrieved');
  } catch (error) {
    return next(error);
  }
};

/**
 * Crée un dossier (racine ou sous-dossier)
 */
const create = async (req, res, next) => {
  try {
    const folder = await folderService.create(req.body, req.user, req.tenantId);
    return ApiResponse.created(res, folder, 'Folder created');
  } catch (error) {
    return next(error);
  }
};

/**
 * Met à jour un dossier
 */
const update = async (req, res, next) => {
  try {
    const folder = await folderService.update(req.params.id, req.body, req.user, req.tenantId);
    return ApiResponse.success(res, folder, 'Folder updated');
  } catch (error) {
    return next(error);
  }
};

/**
 * Supprime un dossier
 */
const deleteFolder = async (req, res, next) => {
  try {
    await folderService.delete(req.params.id, req.user, req.tenantId);
    return ApiResponse.success(res, null, 'Folder deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  getRootFolders,
  explore,
  getById,
  create,
  update,
  deleteFolder,
};
