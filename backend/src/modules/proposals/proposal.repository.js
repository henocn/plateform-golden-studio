'use strict';

const { Proposal, ProposalComment, Validation, User, ProposalAttachment } = require('../../models');
const { Op } = require('sequelize');

class ProposalRepository {
  /* Récupère les propositions avec filtres optionnels (projet, tâche, statut) */
  async findAll({ projectId, taskId, status, isClient = false } = {}) {
    const where = {};
    if (projectId) {
      where['$task.project_id$'] = projectId;
    }
    if (taskId) where.task_id = taskId;
    if (status) where.status = status;
    if (isClient) {
      where.status = { [Op.notIn]: ['draft', 'submitted'] };
    }

    return Proposal.findAll({
      where,
      include: [
        { association: 'author', attributes: ['id', 'first_name', 'last_name'] },
        {
          association: 'task',
          attributes: ['id', 'title', 'project_id'],
          include: [
            {
              association: 'project',
              attributes: ['id', 'title'],
            },
          ],
        },
        { association: 'validatorUser', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC'], ['version_number', 'DESC']],
    });
  }

  /* Récupère une proposition par son ID */
  async findById(id) {
    const where = { id };

    return Proposal.findOne({
      where,
      include: [
        {
          association: 'task',
          attributes: ['id', 'title', 'project_id'],
          include: [
            {
              association: 'project',
              attributes: ['id', 'title'],
            },
          ],
        },
        { association: 'author', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'validatorUser', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'validations', include: [{ association: 'validator', attributes: ['id', 'first_name', 'last_name'] }] },
        { association: 'attachments', order: [['sort_order', 'ASC']] },
      ],
    });
  }

  /* Crée une proposition */
  async create(data) {
    return Proposal.create(data);
  }

  /* Crée les pièces jointes d'une proposition */
  async createAttachments(proposalId, filesMeta) {
    if (!filesMeta || filesMeta.length === 0) return [];
    const records = filesMeta.map((f, i) => ({
      proposal_id: proposalId,
      file_path: f.file_path,
      file_name: f.file_name,
      sort_order: i,
    }));
    await ProposalAttachment.bulkCreate(records);
    return ProposalAttachment.findAll({ where: { proposal_id: proposalId }, order: [['sort_order', 'ASC']] });
  }

  /* Met à jour une proposition */
  async update(id, data) {
    const proposal = await Proposal.findByPk(id);
    if (!proposal) return null;
    return proposal.update(data);
  }

  /* Retourne le prochain numéro de version pour une tâche ou un projet */
  async getNextVersion(projectId, taskId = null) {
    const where = taskId ? { task_id: taskId } : {};
    const maxVersion = await Proposal.max('version_number', { where });
    return (maxVersion || 0) + 1;
  }

  // ─── Comments ────────────────────────────────────────────────

  /* Récupère les commentaires d'une proposition */
  async findComments(proposalId, { isClient = false } = {}) {
    const where = { proposal_id: proposalId };
    if (isClient) where.is_internal = false;

    return ProposalComment.findAll({
      where,
      include: [
        { association: 'author', attributes: ['id', 'first_name', 'last_name', 'user_type'] },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  /* Crée un commentaire sur une proposition */
  async createComment(data) {
    return ProposalComment.create(data);
  }

  // ─── Validations ─────────────────────────────────────────────

  /* Crée une validation pour une proposition */
  async createValidation(data) {
    return Validation.create(data);
  }

  /* Récupère les validations d'une proposition */
  async findValidations(proposalId) {
    return Validation.findAll({
      where: { proposal_id: proposalId },
      include: [
        { association: 'validator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }
}

module.exports = new ProposalRepository();
