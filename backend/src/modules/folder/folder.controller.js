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
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Dossiers récupérés');
  } catch (error) {
    return next(error);
  }
};

/**
 * Récupère tous les dossiers racine (visibles par tous ceux qui ont le droit)
 */
const getRootFolders = async (req, res, next) => {
  try {
    const folders = await folderService.getRootFolders();
    return ApiResponse.success(res, folders, 'Dossiers racine récupérés');
  } catch (error) {
    return next(error);
  }
};

/**
 * Explore un dossier : retourne sous-dossiers + fichiers
 */
const explore = async (req, res, next) => {
  try {
    const result = await folderService.explore(req.params.id);
    return ApiResponse.success(res, result, 'Dossier exploré');
  } catch (error) {
    return next(error);
  }
};

/**
 * Récupère un dossier par son ID
 */
const getById = async (req, res, next) => {
  try {
    const folder = await folderService.getById(req.params.id);
    return ApiResponse.success(res, folder, 'Dossier récupéré');
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
    return ApiResponse.created(res, folder, 'Dossier créé');
  } catch (error) {
    return next(error);
  }
};

/**
 * Met à jour un dossier
 */
const update = async (req, res, next) => {
  try {
    const folder = await folderService.update(req.params.id, req.body);
    return ApiResponse.success(res, folder, 'Dossier mis à jour');
  } catch (error) {
    return next(error);
  }
};

/**
 * Supprime un dossier
 */
const deleteFolder = async (req, res, next) => {
  try {
    await folderService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Dossier supprimé');
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
