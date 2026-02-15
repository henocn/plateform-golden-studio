'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');
const briefController = require('./brief.controller');
const { createBriefSchema, updateBriefSchema } = require('./brief.validation');

// mergeParams: true  → inherit :projectId from parent router
const router = Router({ mergeParams: true });

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  briefController.list);

router.post('/',
  authorize('briefs.create', 'briefs.submit'),
  validate(createBriefSchema),
  briefController.create);

router.put('/:id',
  authorize('briefs.edit'),
  validate(updateBriefSchema),
  briefController.update);

router.post('/:id/attachments',
  authorize('briefs.create', 'briefs.submit'),
  uploadSingle('file'),
  briefController.addAttachment);

router.delete('/:id/attachments/:attachId',
  authorize('briefs.edit', 'briefs.submit'),
  briefController.deleteAttachment);

module.exports = router;
