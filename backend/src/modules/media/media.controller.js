'use strict';

const path = require('path');
const mediaService = require('./media.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await mediaService.list({
      type: req.query.type,
      isGlobal: req.query.is_global,
      search: req.query.search,
      tags: req.query.tags,
      folder_id: req.query.folder_id,
      page, limit, offset,
    });
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Médias récupérés');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const media = await mediaService.getById(req.params.id);
    return ApiResponse.success(res, media, 'Média récupéré');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'File is required' } });
    }
    // Parse metadata from body (multipart/form-data)
    const metadata = {
      name: req.body.name,
      type: req.body.type,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : [],
      is_global: req.body.is_global === 'true' || req.body.is_global === true,
      folder_id: req.body.folder_id || null,
    };
    const media = await mediaService.create(metadata, req.file, req.user);
    return ApiResponse.created(res, media, 'Media uploaded');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const media = await mediaService.update(req.params.id, req.body);
    return ApiResponse.success(res, media, 'Media updated');
  } catch (error) {
    return next(error);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    await mediaService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Media deleted');
  } catch (error) {
    return next(error);
  }
};

const download = async (req, res, next) => {
  try {
    const media = await mediaService.getDownload(req.params.id);
    const filePath = path.resolve(media.file_path);
    return res.download(filePath, media.file_name);
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, getById, create, update, deleteMedia, download };
