'use strict';

const { Proposal, ProposalComment, Validation, User } = require('../../models');
const { Op } = require('sequelize');

class ProposalRepository {
  /**
   * Find proposals for a project, with status filtering for clients
   */
  async findByProject(projectId, { isClient = false, tenantId = null } = {}) {
    const where = { project_id: projectId };
    if (tenantId) where.organization_id = tenantId;
    // Clients cannot see drafts
    if (isClient) {
      where.status = { [Op.notIn]: ['draft', 'submitted'] };
    }

    return Proposal.findAll({
      where,
      include: [
        { association: 'author', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'validatorUser', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['version_number', 'DESC']],
    });
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    return Proposal.findOne({
      where,
      include: [
        { association: 'project', attributes: ['id', 'title'] },
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'author', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'validatorUser', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'validations', include: [{ association: 'validator', attributes: ['id', 'first_name', 'last_name'] }] },
      ],
    });
  }

  async create(data) {
    return Proposal.create(data);
  }

  async update(id, data) {
    const proposal = await Proposal.findByPk(id);
    if (!proposal) return null;
    return proposal.update(data);
  }

  /**
   * Get next version number for a task (if taskId) or for a project.
   * Une même tâche ne peut pas avoir deux propositions avec le même numéro de version.
   */
  async getNextVersion(projectId, taskId = null) {
    const where = taskId ? { task_id: taskId } : { project_id: projectId };
    const maxVersion = await Proposal.max('version_number', { where });
    return (maxVersion || 0) + 1;
  }

  // ─── Comments ────────────────────────────────────────────────

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

  async createComment(data) {
    return ProposalComment.create(data);
  }

  // ─── Validations ─────────────────────────────────────────────

  async createValidation(data) {
    return Validation.create(data);
  }

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
