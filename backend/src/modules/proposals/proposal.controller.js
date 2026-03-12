'use strict';

const path = require('path');
const fs = require('fs');
const proposalService = require('./proposal.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');

const list = async (req, res, next) => {
  try {
    const proposals = await proposalService.list(req.query, req.user);
    return ApiResponse.success(res, proposals, 'Propositions récupérées');
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const filesMeta = files.map((f) => ({
      file_path: path.relative(env.UPLOAD_DIR, f.path).split(path.sep).join('/'),
      file_name: f.originalname || `fichier-${Date.now()}`,
    }));
    if (filesMeta.length > 0) {
      body.file_path = filesMeta[0].file_path;
      body.file_name = filesMeta[0].file_name;
    }
    const proposal = await proposalService.create(body, req.user, filesMeta);
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

/** Liste des fichiers d'une proposition (attachments ou file_path legacy) */
function getProposalFiles(proposal) {
  const attachments = proposal.attachments || [];
  if (attachments.length > 0) {
    return attachments.map((a) => ({ file_path: a.file_path, file_name: a.file_name }));
  }
  if (proposal.file_path) {
    return [{ file_path: proposal.file_path, file_name: proposal.file_name || path.basename(proposal.file_path) || 'fichier' }];
  }
  return [];
}

/** GET /proposals/:id/download — un fichier ou ZIP si plusieurs */
const download = async (req, res, next) => {
  try {
    const proposal = await proposalService.getById(req.params.id, req.user);
    const files = getProposalFiles(proposal);
    if (files.length === 0) return next(ApiError.notFound('Aucun fichier pour cette proposition'));

    if (files.length === 1) {
      const f = files[0];
      const absolutePath = path.resolve(env.UPLOAD_DIR, f.file_path);
      if (!fs.existsSync(absolutePath)) return next(ApiError.notFound('Fichier introuvable'));
      const downloadName = (f.file_name || 'fichier').replace(/"/g, '%22');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      return res.sendFile(absolutePath);
    }

    const archiver = require('archiver');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="proposition-${proposal.id}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => next(err));
    archive.pipe(res);
    for (const f of files) {
      const absolutePath = path.resolve(env.UPLOAD_DIR, f.file_path);
      if (fs.existsSync(absolutePath)) {
        archive.file(absolutePath, { name: f.file_name });
      }
    }
    await archive.finalize();
  } catch (error) {
    return next(error);
  }
};

/** POST /proposals/:id/save-to-media — enregistrer les fichiers dans un dossier médiathèque */
const saveToMedia = async (req, res, next) => {
  try {
    const created = await proposalService.saveToMedia(
      req.params.id,
      req.body.folder_id,
      req.user
    );
    return ApiResponse.success(res, created, `${created.length} fichier(s) enregistré(s) dans la médiathèque`);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list, create, getById, update, submitToClient,
  listComments, addComment,
  validateProposal, listValidations,
  download,
  saveToMedia,
};
