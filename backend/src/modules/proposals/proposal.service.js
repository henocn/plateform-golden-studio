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
   * Liste les propositions (filtrage par projet, tâche, statut possible)
   */
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    const projectId = filters?.project_id || filters?.projectId || null;
    const taskId = filters?.task_id || filters?.taskId || null;
    const status = filters?.status || null;
    return proposalRepository.findAll({ projectId, taskId, status, isClient });
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
  async create(data, user, filesMeta = []) {
    const taskId = data.task_id || null;
    if (!taskId) {
      throw ApiError.badRequest('Une tâche est requise pour créer une proposition');
    }

    const task = await Task.findByPk(taskId, { attributes: ['id', 'project_id', 'title'] });
    if (!task) {
      throw ApiError.notFound('Tâche');
    }

    const projectId = task.project_id || null;
    const versionNumber = await proposalRepository.getNextVersion(projectId, taskId);

    const proposal = await proposalRepository.create({
      ...data,
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

  /* Notifie le superviseur de la tâche lors de la création d'une proposition */
  async _notifyNewProposal(proposal, taskId, projectId) {
    if (!taskId) return;

    const task = await Task.findByPk(taskId, { attributes: ['id', 'title', 'supervisor_id'] });
    if (!task || !task.supervisor_id) return;

    // Évite de notifier l'auteur lui-même si c'est aussi le superviseur
    if (task.supervisor_id === proposal.author_id) return;

    await notificationService.notify({
      userId: task.supervisor_id,
      type: 'task_pending_validation',
      title: `Validation de proposition de tâche — ${task.title}`,
      message: `Vous avez une proposition de tâche à valider : « ${task.title} ». Cette proposition (v${proposal.version_number}) a été envoyée le ${new Date(proposal.created_at || new Date()).toLocaleDateString('fr-FR')}.`,
      referenceId: task.id,
      referenceType: 'task',
      link: `/tasks/${task.id}`,
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

    await proposalRepository.update(proposalId, { status });

    // Si la proposition est approuvée, on passe automatiquement la tâche en "done"
    if (status === 'approved' && proposal.task_id) {
      try {
        const taskService = require('../tasks/task.service');
        await taskService.updateStatus(proposal.task_id, 'done');
      } catch (err) {
        logger.error('[Proposal] Échec de la mise à jour du statut de la tâche après approbation de proposition', {
          proposalId,
          taskId: proposal.task_id,
          error: err?.message,
        });
      }
    }

    this._notifyValidationResult(proposal, status, user, comments).catch((err) => {
      logger.error('[NOTIF] onValidationResult error:', err);
    });

    return validation;
  }

  /* Notifie le chargé de la tâche et l'auteur de la proposition (si différents du validateur et entre eux) */
  async _notifyValidationResult(proposal, status, validator, comments) {
    if (!proposal.task_id) return;

    const task = await Task.findByPk(proposal.task_id, {
      attributes: ['id', 'title', 'assigned_to'],
    });
    if (!task) return;

    const statusLabels = {
      approved: 'approuvée',
      needs_revision: 'en demande de révision',
      rejected: 'refusée',
    };
    const label = statusLabels[status] || status;
    const recipientIds = new Set();

    if (task.assigned_to && task.assigned_to !== validator.id) {
      recipientIds.add(task.assigned_to);
    }
    if (proposal.author_id && proposal.author_id !== validator.id) {
      recipientIds.add(proposal.author_id);
    }

    if (recipientIds.size === 0) return;

    const commentText = comments || '(Aucun commentaire fourni)';

    await notificationService.notifyMany([...recipientIds], {
      type: 'task_pending_validation',
      title: `Statut de votre proposition — ${task.title}`,
      message: `Votre proposition (v${proposal.version_number}) pour la tâche « ${task.title} » a été ${label}.\n\nCommentaire du validateur :\n${commentText}`,
      referenceId: task.id,
      referenceType: 'task',
      link: `/tasks/${task.id}`,
    });
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
