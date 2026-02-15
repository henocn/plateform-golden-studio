'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const pubController = require('./publication.controller');
const { createPublicationSchema, updatePublicationSchema } = require('./publication.validation');

const router = Router({ mergeParams: true });

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  pubController.list);

router.post('/',
  authorize('publications.manage'),
  validate(createPublicationSchema),
  pubController.create);

router.put('/:id',
  authorize('publications.manage'),
  validate(updatePublicationSchema),
  pubController.update);

router.delete('/:id',
  authorize('projects.delete'),
  pubController.deletePublication);

module.exports = router;
