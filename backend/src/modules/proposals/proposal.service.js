'use strict';

const proposalRepository = require('./proposal.repository');
const ApiError = require('../../utils/ApiError');
const { Project } = require('../../models');

class ProposalService {
  /**
   * List proposals for a project
   * Internal: sees all statuses. Client: no drafts/submitted.
   */
  async listByProject(projectId, user) {
    const isClient = user.user_type === 'client';
    return proposalRepository.findByProject(projectId, {
      isClient,
      tenantId: isClient ? user.organization_id : null,
    });
  }

  async getById(id, user) {
    const isClient = user.user_type === 'client';
    const proposal = await proposalRepository.findById(id, isClient ? user.organization_id : null);
    if (!proposal) throw ApiError.notFound('Proposal');
    // Client cannot see draft/submitted proposals
    if (isClient && ['draft', 'submitted'].includes(proposal.status)) {
      throw ApiError.notFound('Proposal');
    }
    return proposal;
  }

  /**
   * Create proposal — internal contributor+, auto version numbering
   */
  async create(projectId, data, user) {
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');

    const versionNumber = await proposalRepository.getNextVersion(projectId);

    return proposalRepository.create({
      ...data,
      project_id: projectId,
      organization_id: project.organization_id,
      author_id: user.id,
      version_number: versionNumber,
      status: 'draft',
    });
  }

  /**
   * Update — internal only, only if status is draft
   */
  async update(id, data) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound('Proposal');
    if (proposal.status !== 'draft') {
      throw ApiError.badRequest('Only draft proposals can be edited');
    }
    return proposalRepository.update(id, data);
  }

  /**
   * Submit to client — internal validator+
   * Changes status: draft/submitted → pending_client_validation
   */
  async submitToClient(id, user) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound('Proposal');
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
    if (!proposal) throw ApiError.notFound('Proposal');

    return proposalRepository.createComment({
      proposal_id: proposalId,
      organization_id: proposal.organization_id,
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
    if (!proposal) throw ApiError.notFound('Proposal');
    if (proposal.status !== 'pending_client_validation') {
      throw ApiError.badRequest('Proposal is not pending client validation');
    }

    // Create validation record
    const validation = await proposalRepository.createValidation({
      proposal_id: proposalId,
      organization_id: proposal.organization_id,
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
}

module.exports = new ProposalService();
