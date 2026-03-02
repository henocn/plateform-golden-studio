'use strict';

const calendarService = require('./calendar.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const ApiError = require('../../utils/ApiError');
const fs = require('fs');

/** Liste les événements du calendrier avec filtres basiques. */
const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await calendarService.list({
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page, limit, offset,
    }, req.user);
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Events retrieved');
  } catch (error) {
    return next(error);
  }
};

/** Crée un nouvel événement de calendrier. */
const create = async (req, res, next) => {
  try {
    const event = await calendarService.create(req.body, req.user);
    return ApiResponse.created(res, event, 'Event created');
  } catch (error) {
    return next(error);
  }
};

/** Récupère le détail d’un événement par son ID. */
const getById = async (req, res, next) => {
  try {
    const event = await calendarService.getById(req.params.id, req.user);
    return ApiResponse.success(res, event, 'Event retrieved');
  } catch (error) {
    return next(error);
  }
};

/** Met à jour un événement existant. */
const update = async (req, res, next) => {
  try {
    const event = await calendarService.update(req.params.id, req.body);
    return ApiResponse.success(res, event, 'Event updated');
  } catch (error) {
    return next(error);
  }
};

/** Met à jour uniquement le statut d’un événement. */
const patchStatus = async (req, res, next) => {
  try {
    const event = await calendarService.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, event, 'Event status updated');
  } catch (error) {
    return next(error);
  }
};

/** Supprime définitivement un événement. */
const deleteEvent = async (req, res, next) => {
  try {
    await calendarService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Event deleted');
  } catch (error) {
    return next(error);
  }
};

/** Importe des événements depuis un fichier Excel. */
const importExcel = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) throw ApiError.badRequest('Le fichier Excel est requis');
    filePath = req.file.path || null;
    const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);
    const result = await calendarService.importExcel(
      fileBuffer,
      req.user,
    );
    return ApiResponse.success(res, result, 'Events calendar imported');
  } catch (error) {
    return next(error);
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

/** Exporte les événements dans un fichier Excel. */
const exportExcel = async (req, res, next) => {
  try {
    const buffer = await calendarService.exportExcel({
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
    }, req.user);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="calendrier-evenements.xlsx"');
    return res.status(200).send(buffer);
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
  deleteEvent,
  importExcel,
  exportExcel,
};
