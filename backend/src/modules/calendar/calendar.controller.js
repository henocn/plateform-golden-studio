'use strict';

const calendarService = require('./calendar.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await calendarService.list({
      tenantId: req.tenantId,
      type: req.query.type,
      projectId: req.query.projectId,
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

const create = async (req, res, next) => {
  try {
    const event = await calendarService.create(req.body, req.user);
    return ApiResponse.created(res, event, 'Event created');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const event = await calendarService.getById(req.params.id, req.user);
    return ApiResponse.success(res, event, 'Event retrieved');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const event = await calendarService.update(req.params.id, req.body);
    return ApiResponse.success(res, event, 'Event updated');
  } catch (error) {
    return next(error);
  }
};

const patchStatus = async (req, res, next) => {
  try {
    const event = await calendarService.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, event, 'Event status updated');
  } catch (error) {
    return next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await calendarService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Event deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, create, getById, update, patchStatus, deleteEvent };
