'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const proposalController = require('./proposal.controller');
const {
  createProposalSchema,
  updateProposalSchema,
  validateProposalSchema,
  createCommentSchema,
} = require('./proposal.validation');

// mergeParams: true → inherit :projectId from parent
const router = Router({ mergeParams: true });

router.use(authenticate, tenantMiddleware);

// ─── Proposal CRUD ──────────────────────────────────────────
router.get('/',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  proposalController.list);

router.post('/',
  authorize('proposals.create'),
  validate(createProposalSchema),
  proposalController.create);

router.get('/:id',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  proposalController.getById);

router.put('/:id',
  authorize('proposals.create'),
  validate(updateProposalSchema),
  proposalController.update);

// Submit to client (internal validator+)
router.patch('/:id/submit',
  authorize('proposals.submit_to_client'),
  proposalController.submitToClient);

// ─── Comments ──────────────────────────────────────────────
router.get('/:id/comments',
  authorize('projects.view_all_orgs', 'projects.view_own'),
  proposalController.listComments);

router.post('/:id/comments',
  authorize('proposals.create', 'proposals.validate_client'),
  validate(createCommentSchema),
  proposalController.addComment);

// ─── Validations (client) ──────────────────────────────────
router.post('/:id/validate',
  authorize('proposals.validate_client'),
  validate(validateProposalSchema),
  proposalController.validateProposal);

router.get('/:id/validations',
  authorize('projects.view_all_orgs', 'proposals.validate_client'),
  proposalController.listValidations);

module.exports = router;
