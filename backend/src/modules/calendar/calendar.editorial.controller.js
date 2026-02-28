'use strict';

const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const editorialService = require('./calendar.editorial.service');
const ApiError = require('../../utils/ApiError');
const fs = require('fs');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await editorialService.list({
      projectId: req.query.projectId,
      taskId: req.query.taskId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page,
      limit,
      offset,
    }, req.user);
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Editorial entries retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const publication = await editorialService.create(req.body, req.user);
    return ApiResponse.created(res, publication, 'Editorial entry created');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const publication = await editorialService.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, publication, 'Editorial entry updated');
  } catch (error) {
    return next(error);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const publication = await editorialService.assignTask(req.params.id, req.body.task_id, req.user);
    return ApiResponse.success(res, publication, 'Task assigned to editorial entry');
  } catch (error) {
    return next(error);
  }
};

const importExcel = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) throw ApiError.badRequest('Le fichier Excel est requis');
    filePath = req.file.path || null;
    const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);
    const result = await editorialService.importExcel(
      fileBuffer,
      req.user,
    );
    return ApiResponse.success(res, result, 'Editorial calendar imported');
  } catch (error) {
    return next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const buffer = await editorialService.exportExcel({
      projectId: req.query.projectId,
      taskId: req.query.taskId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
    }, req.user);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="calendrier-editorial.xlsx"');
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  create,
  update,
  assignTask,
  importExcel,
  exportExcel,
};

