'use strict';

const proposalService = require('./proposal.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const proposals = await proposalService.listByProject(req.params.projectId, req.user);
    return ApiResponse.success(res, proposals, 'Proposals retrieved');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const proposal = await proposalService.create(req.params.projectId, req.body, req.user);
    return ApiResponse.created(res, proposal, 'Proposal created');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const proposal = await proposalService.getById(req.params.id, req.user);
    return ApiResponse.success(res, proposal, 'Proposal retrieved');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const proposal = await proposalService.update(req.params.id, req.body);
    return ApiResponse.success(res, proposal, 'Proposal updated');
  } catch (error) {
    return next(error);
  }
};

const submitToClient = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitToClient(req.params.id, req.user);
    return ApiResponse.success(res, proposal, 'Proposal submitted to client');
  } catch (error) {
    return next(error);
  }
};

// ─── Comments ────────────────────────────────────────────────

const listComments = async (req, res, next) => {
  try {
    const comments = await proposalService.listComments(req.params.id, req.user);
    return ApiResponse.success(res, comments, 'Comments retrieved');
  } catch (error) {
    return next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await proposalService.addComment(req.params.id, req.body.content, req.user);
    return ApiResponse.created(res, comment, 'Comment added');
  } catch (error) {
    return next(error);
  }
};

// ─── Validations ─────────────────────────────────────────────

const validateProposal = async (req, res, next) => {
  try {
    const validation = await proposalService.validate(req.params.id, req.body, req.user);
    return ApiResponse.created(res, validation, 'Validation submitted');
  } catch (error) {
    return next(error);
  }
};

const listValidations = async (req, res, next) => {
  try {
    const validations = await proposalService.listValidations(req.params.id);
    return ApiResponse.success(res, validations, 'Validations retrieved');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list, create, getById, update, submitToClient,
  listComments, addComment,
  validateProposal, listValidations,
};
