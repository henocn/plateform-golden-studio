'use strict';

const taskService = require('./task.service');
const ApiResponse = require('../../utils/ApiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await taskService.list({
      tenantId: req.tenantId,
      projectId: req.query.projectId,
      assigneeId: req.query.assignee,
      status: req.query.status,
      overdue: req.query.overdue,
      urgent: req.query.urgent,
      search: req.query.search,
      page, limit, offset,
    }, req.user);
    const meta = buildPaginationMeta(page, limit, total);
    return ApiResponse.success(res, { data, meta }, 'Tasks retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const task = await taskService.create(req.body, req.user);
    return ApiResponse.created(res, task, 'Task created successfully');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id, req.user);
    return ApiResponse.success(res, task, 'Task retrieved');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.body);
    return ApiResponse.success(res, task, 'Task updated successfully');
  } catch (error) {
    return next(error);
  }
};

const patchStatus = async (req, res, next) => {
  try {
    const task = await taskService.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, task, 'Task status updated');
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.delete(req.params.id);
    return ApiResponse.success(res, null, 'Task deleted');
  } catch (error) {
    return next(error);
  }
};

// ─── Comments ────────────────────────────────────────────────

const listComments = async (req, res, next) => {
  try {
    const comments = await taskService.listComments(req.params.id, req.user);
    return ApiResponse.success(res, comments, 'Comments retrieved');
  } catch (error) {
    return next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await taskService.addComment(
      req.params.id,
      req.body.content,
      req.user,
      req.body.is_internal
    );
    return ApiResponse.created(res, comment, 'Comment added');
  } catch (error) {
    return next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await taskService.deleteComment(req.params.cid, req.user.id);
    return ApiResponse.success(res, null, 'Comment deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = { list, create, getById, update, patchStatus, deleteTask, listComments, addComment, deleteComment };
