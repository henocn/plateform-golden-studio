'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const reportingController = require('./reporting.controller');

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/overview',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.overview);

router.get('/projects',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.projectStats);

router.get('/users',
  authorize('reporting.global'),
  reportingController.userStats);

router.get('/publications',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.publicationStats);

router.get('/validations',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.validationStats);

router.get('/export/pdf',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.exportPdf);

router.get('/export/excel',
  authorize('reporting.global', 'reporting.own_org'),
  reportingController.exportExcel);

module.exports = router;
