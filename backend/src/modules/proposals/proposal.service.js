'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const proposalRepository = require('./proposal.repository');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const { Project, Task, Media, Folder } = require('../../models');
const notificationService = require('../notifications/notification.service');
const logger = require('../../utils/logger');

class ProposalService {
  /**
   * Liste les propositions d'un projet
   */
  async listByProject(projectId, user) {
    const isClient = user.user_type === 'client';
    return proposalRepository.findByProject(projectId, { isClient });
  }

  /**
   * Récupère une proposition par ID
   */
  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound('Proposition');
    if (isClient && ['draft', 'submitted'].includes(proposal.status)) {
      throw ApiError.notFound('Proposition');
    }
    return proposal;
  }

  /**
   * Create proposal — internal contributor+, versioning automatique par tâche ou par projet.
   * Si task_id est fourni : version par tâche (pas de doublon de version pour la même tâche).
   */
  async create(projectId, data, user, filesMeta = []) {
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');

    const taskId = data.task_id || null;
    const versionNumber = await proposalRepository.getNextVersion(projectId, taskId);

    const proposal = await proposalRepository.create({
      ...data,
      project_id: projectId,
      task_id: taskId,
      author_id: user.id,
      version_number: versionNumber,
      status: 'pending_client_validation',
    });
    if (filesMeta.length > 0) {
      await proposalRepository.createAttachments(proposal.id, filesMeta);
    }

    this._notifyNewProposal(proposal, taskId, projectId).catch((err) => {
      logger.error('[NOTIF] onNewProposal error:', err);
    });

    return proposalRepository.findById(proposal.id);
  }

  /* Notifie les validateurs lors de la création d'une proposition */
  async _notifyNewProposal(proposal, taskId, projectId) {
    const PERMISSIONS = require('../../config/permissions');
    const validatorRoles = PERMISSIONS['proposals.validate'] || [];
    const notifRepo = require('../notifications/notification.repository');
    const validators = await notifRepo.findUsersByRoles(validatorRoles);
    const recipientIds = new Set(validators.map((v) => v.id));

    if (taskId) {
      const task = await Task.findByPk(taskId, { attributes: ['id', 'created_by', 'title'] });
      if (task && task.created_by) recipientIds.add(task.created_by);
    }

    recipientIds.delete(proposal.author_id);

    if (!recipientIds.size) return;

    const project = await Project.findByPk(projectId, { attributes: ['id', 'title'] });
    const projectTitle = project?.title || 'Projet';

    await notificationService.notifyMany([...recipientIds], {
      type: 'task_pending_validation',
      title: `Nouvelle proposition — "${projectTitle}"`,
      message: `Une nouvelle proposition (v${proposal.version_number}) a été soumise pour le projet "${projectTitle}".`,
      referenceId: taskId || projectId,
      referenceType: taskId ? 'task' : 'project',
      link: taskId ? `/tasks/${taskId}` : `/projects/${projectId}`,
    });
  }

  /**
   * Update — internal only, only if status is draft
   */
  async update(id, data) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound('Proposition');
    if (proposal.status !== 'draft') {
      throw ApiError.badRequest('Seules les propositions en brouillon peuvent être modifiées');
    }
    return proposalRepository.update(id, data);
  }

  /**
   * Submit to client — internal validator+
   * Changes status: draft/submitted → pending_client_validation
   */
  async submitToClient(id, user) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound('Proposition');
    if (!['draft', 'submitted'].includes(proposal.status)) {
      throw ApiError.proposalNotSubmittable();
    }
    return proposalRepository.update(id, {
      status: 'pending_client_validation',
      validator_id: user.id,
      submitted_at: new Date(),
    });
  }

  // ─── Comments ────────────────────────────────────────────────

  async listComments(proposalId, user) {
    const isClient = user.user_type === 'client';
    return proposalRepository.findComments(proposalId, { isClient });
  }

  async addComment(proposalId, content, user) {
    const proposal = await proposalRepository.findById(proposalId);
    if (!proposal) throw ApiError.notFound('Proposition');

    return proposalRepository.createComment({
      proposal_id: proposalId,
      user_id: user.id,
      content,
      is_internal: user.user_type === 'internal',
    });
  }

  // ─── Validations ─────────────────────────────────────────────

  /**
   * Client validates proposal — client_validator or client_admin
   * Possible decisions: approved, needs_revision, rejected
   */
  async validate(proposalId, { status, comments }, user) {
    const proposal = await proposalRepository.findById(proposalId);
    if (!proposal) throw ApiError.notFound('Proposition');
    // TODO: only allow if user is assigned validator for this proposal or is client_admin of the org

    // Create validation record
    const validation = await proposalRepository.createValidation({
      proposal_id: proposalId,
      validator_id: user.id,
      status,
      comments,
      validated_at: new Date(),
    });

    // Update proposal status accordingly
    await proposalRepository.update(proposalId, { status });

    return validation;
  }

  async listValidations(proposalId) {
    return proposalRepository.findValidations(proposalId);
  }

  /**
   * Sauvegarder les fichiers de la proposition dans un dossier de la médiathèque
   */
  async saveToMedia(proposalId, folderId, user) {
    const proposal = await proposalRepository.findById(proposalId);
    if (!proposal) throw ApiError.notFound('Proposition');
    const folder = await Folder.findByPk(folderId);
    if (!folder) throw ApiError.notFound('Dossier');

    const attachments = proposal.attachments || [];
    const files = attachments.length > 0
      ? attachments.map((a) => ({ file_path: a.file_path, file_name: a.file_name }))
      : (proposal.file_path ? [{ file_path: proposal.file_path, file_name: proposal.file_name || path.basename(proposal.file_path) }] : []);

    if (files.length === 0) throw ApiError.badRequest('Aucun fichier à enregistrer');

    const mediaDir = path.join(env.UPLOAD_DIR, 'media');
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

    const created = [];
    for (const f of files) {
      const srcPath = path.resolve(env.UPLOAD_DIR, f.file_path);
      if (!fs.existsSync(srcPath)) continue;
      const ext = path.extname(f.file_name) || '';
      const base = path.basename(f.file_name, ext) || 'fichier';
      const safeName = `${crypto.randomUUID()}${ext}`;
      const destRelative = path.join('media', safeName).split(path.sep).join('/');
      const destPath = path.join(env.UPLOAD_DIR, destRelative);
      fs.copyFileSync(srcPath, destPath);
      const media = await Media.create({
        folder_id: folderId,
        name: base,
        type: 'document',
        file_path: destRelative,
        file_name: f.file_name,
        uploaded_by: user.id,
        is_global: false,
      });
      created.push(media);
    }
    return created;
  }
}

module.exports = new ProposalService();
