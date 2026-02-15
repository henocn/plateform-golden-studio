'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');
const mediaController = require('./media.controller');
const { updateMediaSchema, listMediaQuery } = require('./media.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('mediatheque.upload', 'mediatheque.view'),
  validate(listMediaQuery, 'query'),
  mediaController.list);

router.post('/',
  authorize('mediatheque.upload'),
  uploadSingle('file'),
  mediaController.create);

router.get('/:id',
  authorize('mediatheque.upload', 'mediatheque.view'),
  mediaController.getById);

router.put('/:id',
  authorize('mediatheque.upload'),
  validate(updateMediaSchema),
  mediaController.update);

router.delete('/:id',
  authorize('projects.delete'),
  mediaController.deleteMedia);

router.get('/:id/download',
  authorize('mediatheque.upload', 'mediatheque.view'),
  mediaController.download);

module.exports = router;
