'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const userController = require('./user.controller');
const {
  createInternalUserSchema,
  createClientUserSchema,
  updateUserSchema,
  changeRoleSchema,
  patchStatusSchema,
  listUsersQuery,
} = require('./user.validation');

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Members (lightweight for dropdowns / assignment) ────────
router.get('/members',
  authorize('users.list_members', 'users.manage_internal', 'users.manage_clients'),
  userController.listMembers);

// ─── Internal Users (backoffice only) ────────────────────────
router.get('/internal',
  authorize('users.manage_internal'),
  validate(listUsersQuery, 'query'),
  userController.listInternal);

router.post('/internal',
  authorize('users.manage_internal'),
  validate(createInternalUserSchema),
  userController.createInternal);

router.patch('/internal/:id/role',
  authorize('users.manage_internal'),
  validate(changeRoleSchema),
  userController.changeInternalRole);

// ─── Client Users ────────────────────────────────────────────
router.get('/clients',
  tenantMiddleware,
  authorize('users.manage_clients', 'users.manage_own_org'),
  validate(listUsersQuery, 'query'),
  userController.listClients);

router.post('/clients',
  tenantMiddleware,
  authorize('users.manage_clients', 'users.manage_own_org'),
  validate(createClientUserSchema),
  userController.createClient);

router.patch('/clients/:id/role',
  tenantMiddleware,
  authorize('users.manage_clients', 'users.manage_own_org'),
  validate(changeRoleSchema),
  userController.changeClientRole);

// ─── Common Routes ──────────────────────────────────────────
router.get('/:id', userController.getById);
router.put('/:id', validate(updateUserSchema), userController.update);
router.patch('/:id/status', authorize('users.manage_internal', 'users.manage_clients', 'users.manage_own_org'), validate(patchStatusSchema), userController.patchStatus);
router.delete('/:id', authorize('users.manage_internal', 'users.manage_clients'), userController.deleteUser);

module.exports = router;
