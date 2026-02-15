'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const calendarController = require('./calendar.controller');
const {
  createEventSchema,
  updateEventSchema,
  patchEventStatusSchema,
  listEventQuery,
} = require('./calendar.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get('/',
  authorize('calendar.manage', 'calendar.view'),
  validate(listEventQuery, 'query'),
  calendarController.list);

router.post('/',
  authorize('calendar.manage'),
  validate(createEventSchema),
  calendarController.create);

router.get('/:id',
  authorize('calendar.manage', 'calendar.view'),
  calendarController.getById);

router.put('/:id',
  authorize('calendar.manage'),
  validate(updateEventSchema),
  calendarController.update);

router.patch('/:id/status',
  authorize('calendar.manage'),
  validate(patchEventStatusSchema),
  calendarController.patchStatus);

router.delete('/:id',
  authorize('projects.delete'),
  calendarController.deleteEvent);

module.exports = router;
