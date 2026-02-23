'use strict';

const proposalService = require('./proposal.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const proposals = await proposalService.listByProject(req.params.projectId, req.user);
    return ApiResponse.success(res, proposals, 'Propositions récupérées');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file && req.file.path) body.file_path = req.file.path;
    const proposal = await proposalService.create(req.params.projectId, body, req.user);
    return ApiResponse.created(res, proposal, 'Proposition créée avec succès');
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const proposal = await proposalService.getById(req.params.id, req.user);
    return ApiResponse.success(res, proposal, 'Proposition récupérée');
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const proposal = await proposalService.update(req.params.id, req.body);
    return ApiResponse.success(res, proposal, 'Proposition mise à jour');
  } catch (error) {
    return next(error);
  }
};

const submitToClient = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitToClient(req.params.id, req.user);
    return ApiResponse.success(res, proposal, 'Proposition soumise au client');
  } catch (error) {
    return next(error);
  }
};

// ─── Comments ────────────────────────────────────────────────

const listComments = async (req, res, next) => {
  try {
    const comments = await proposalService.listComments(req.params.id, req.user);
    return ApiResponse.success(res, comments, 'Commentaires récupérés');
  } catch (error) {
    return next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await proposalService.addComment(req.params.id, req.body.content, req.user);
    return ApiResponse.created(res, comment, 'Commentaire ajouté');
  } catch (error) {
    return next(error);
  }
};

// ─── Validations ─────────────────────────────────────────────

const validateProposal = async (req, res, next) => {
  try {
    const validation = await proposalService.validate(req.params.id, req.body, req.user);
    return ApiResponse.created(res, validation, 'Validation soumise');
  } catch (error) {
    return next(error);
  }
};

const listValidations = async (req, res, next) => {
  try {
    const validations = await proposalService.listValidations(req.params.id);
    return ApiResponse.success(res, validations, 'Validations récupérées');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list, create, getById, update, submitToClient,
  listComments, addComment,
  validateProposal, listValidations,
};
