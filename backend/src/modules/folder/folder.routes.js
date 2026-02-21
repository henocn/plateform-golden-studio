'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const folderController = require('./folder.controller');
const { createFolderSchema, updateFolderSchema, listFolderQuery } = require('./folder.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('mediatheque.upload', 'mediatheque.view'),
  validate(listFolderQuery, 'query'),
  folderController.list);

router.post('/',
  authorize('mediatheque.upload'),
  validate(createFolderSchema),
  folderController.create);

router.get('/:id',
  authorize('mediatheque.upload', 'mediatheque.view'),
  folderController.getById);

router.put('/:id',
  authorize('mediatheque.upload'),
  validate(updateFolderSchema),
  folderController.update);

router.delete('/:id',
  authorize('projects.delete'),
  folderController.deleteFolder);

module.exports = router;
