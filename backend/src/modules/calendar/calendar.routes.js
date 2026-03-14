'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');
const eventController = require('./calendar.controller');
const editorialController = require('./calendar.editorial.controller');
const {
  createEventSchema,
  updateEventSchema,
  patchEventStatusSchema,
  listEventQuery,
} = require('./calendar.validation');
const eventTemplateController = require('./eventTemplate.controller');
const {
  createEventTemplateSchema,
  updateEventTemplateSchema,
} = require('./eventTemplate.validation');
const {
  createEditorialSchema,
  updateEditorialSchema,
  assignEditorialTaskSchema,
  listEditorialQuery,
} = require('./calendar.editorial.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

// ─── Templates d'événements ─────────────────────────────────
router.get(
  '/events/templates',
  authorize('calendar.templates'),
  eventTemplateController.list,
);
router.post(
  '/events/templates',
  authorize('calendar.templates'),
  validate(createEventTemplateSchema),
  eventTemplateController.create,
);
router.put(
  '/events/templates/:id',
  authorize('calendar.templates'),
  validate(updateEventTemplateSchema),
  eventTemplateController.update,
);
router.delete(
  '/events/templates/:id',
  authorize('calendar.templates'),
  eventTemplateController.remove,
);

router.get('/',
  authorize('calendar.manage', 'calendar.view'),
  validate(listEventQuery, 'query'),
  eventController.list);

router.post('/',
  authorize('calendar.manage'),
  validate(createEventSchema),
  eventController.create);

// Events calendar aliases + import/export
router.get('/events',
  authorize('calendar.manage', 'calendar.view'),
  validate(listEventQuery, 'query'),
  eventController.list);
router.post('/events',
  authorize('calendar.manage'),
  validate(createEventSchema),
  eventController.create);
router.post('/events/import',
  authorize('calendar.manage'),
  uploadSingle('file', { maxFileSize: 8 * 1024 * 1024 }),
  eventController.importExcel);
router.get('/events/export',
  authorize('calendar.manage', 'calendar.view'),
  eventController.exportExcel);

// Editorial calendar endpoints
router.get('/editorial',
  authorize('calendar.manage', 'calendar.view'),
  validate(listEditorialQuery, 'query'),
  editorialController.list);
router.post('/editorial',
  authorize('calendar.manage'),
  validate(createEditorialSchema),
  editorialController.create);
// Routes spécifiques (import/export) avant les routes paramétrées
router.post('/editorial/import',
  authorize('calendar.manage'),
  uploadSingle('file', { maxFileSize: 8 * 1024 * 1024 }),
  editorialController.importExcel);
router.get('/editorial/export',
  authorize('calendar.manage', 'calendar.view'),
  editorialController.exportExcel);
router.get('/editorial/:id',
  authorize('calendar.manage', 'calendar.view'),
  editorialController.getById);
router.put('/editorial/:id',
  authorize('calendar.manage'),
  validate(updateEditorialSchema),
  editorialController.update);
router.delete('/editorial/:id',
  authorize('calendar.manage'),
  editorialController.deleteEntry);
router.patch('/editorial/:id/assign-task',
  authorize('calendar.manage'),
  validate(assignEditorialTaskSchema),
  editorialController.assignTask);

router.get('/:id',
  authorize('calendar.manage', 'calendar.view'),
  eventController.getById);

router.put('/:id',
  authorize('calendar.manage'),
  validate(updateEventSchema),
  eventController.update);

router.patch('/:id/status',
  authorize('calendar.manage'),
  validate(patchEventStatusSchema),
  eventController.patchStatus);

router.delete('/:id',
  authorize('projects.delete'),
  eventController.deleteEvent);

module.exports = router;
