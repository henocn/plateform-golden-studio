'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const projectController = require('./project.controller');
const {
  createProjectSchema,
  updateProjectSchema,
  patchStatusSchema,
  listProjectQuery,
} = require('./project.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  validate(listProjectQuery, 'query'),
  projectController.list);

router.post('/',
  authorize('projects.create'),
  validate(createProjectSchema),
  projectController.create);

router.get('/dashboard/stats',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  projectController.getDashboardStats);

router.get('/:id',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  projectController.getById);

router.put('/:id',
  authorize('projects.edit'),
  validate(updateProjectSchema),
  projectController.update);

router.patch('/:id/status',
  authorize('projects.edit'),
  validate(patchStatusSchema),
  projectController.patchStatus);

router.delete('/:id',
  authorize('projects.delete'),
  projectController.deleteProject);

module.exports = router;
