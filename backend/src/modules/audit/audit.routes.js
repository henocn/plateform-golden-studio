'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const auditController = require('./audit.controller');
const { listAuditQuery } = require('./audit.validation');

const router = Router();

router.use(authenticate);

router.get('/',
  authorize('audit.view'),
  validate(listAuditQuery, 'query'),
  auditController.list);

router.get('/:id',
  authorize('audit.view'),
  auditController.getById);

module.exports = router;
