'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize, internalOnly } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const taskController = require('./task.controller');
const {
  createTaskSchema,
  updateTaskSchema,
  patchTaskStatusSchema,
  listTaskQuery,
  createCommentSchema,
} = require('./task.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

// ─── Task CRUD ─────────────────────────────────────────────
router.get('/',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  validate(listTaskQuery, 'query'),
  taskController.list);

router.post('/',
  authorize('tasks.create'),
  validate(createTaskSchema),
  taskController.create);

router.get('/:id',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  taskController.getById);

router.get('/:id/proposals',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  taskController.getProposals);

router.put('/:id',
  authorize('tasks.edit'),
  validate(updateTaskSchema),
  taskController.update);

router.patch('/:id/status',
  authorize('tasks.edit'),
  validate(patchTaskStatusSchema),
  taskController.patchStatus);

router.delete('/:id',
  authorize('tasks.delete'),
  taskController.deleteTask);

// ─── Comments ──────────────────────────────────────────────
router.get('/:id/comments',
  authorize('projects.view_all_orgs', 'projects.view_own', 'tasks.comment'),
  taskController.listComments);

router.post('/:id/comments',
  authorize('tasks.create', 'tasks.comment'),
  validate(createCommentSchema),
  taskController.addComment);

router.delete('/:id/comments/:cid',
  authorize('tasks.create', 'tasks.comment'),
  taskController.deleteComment);

module.exports = router;
