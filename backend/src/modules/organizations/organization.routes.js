"use strict";

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize, internalOnly } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadOrganizationLogo } = require('../../middlewares/upload.middleware');
const orgController = require('./organization.controller');
const {
  createOrganizationSchema,
  updateOrganizationSchema,
  patchStatusSchema,
  listOrganizationQuery,
} = require('./organization.validation');

const router = Router();

// GET /organizations/current — public, for branding (logo, name) — single-organization mode
router.get('/current', orgController.getCurrent);

// All other routes require authentication + internal user
router.use(authenticate, internalOnly);

// GET /organizations — list all orgs
router.get('/', validate(listOrganizationQuery, 'query'), orgController.list);

// POST /organizations — create org (super_admin only via organizations.manage)
router.post('/', authorize('organizations.manage'), validate(createOrganizationSchema), orgController.create);

// GET /organizations/:id — detail
router.get('/:id', orgController.getById);

// PUT /organizations/:id — update (optional logo upload)
router.put('/:id', authorize('organizations.manage'), uploadOrganizationLogo(), validate(updateOrganizationSchema), orgController.update);

// PATCH /organizations/:id/status — activate/deactivate
router.patch('/:id/status', authorize('organizations.manage'), validate(patchStatusSchema), orgController.patchStatus);

// GET /organizations/:id/users — users of this org
router.get('/:id/users', orgController.getUsers);

// GET /organizations/:id/projects — projects of this org
router.get('/:id/projects', orgController.getProjects);

// GET /organizations/:id/stats — KPIs of this org
router.get('/:id/stats', orgController.getStats);

// DELETE /organizations/:id — supprimer une organisation
router.delete('/:id', authorize('organizations.manage'), orgController.remove);

module.exports = router;
