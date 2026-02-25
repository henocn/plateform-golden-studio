'use strict';

const publicationRepository = require('./publication.repository');
const ApiError = require('../../utils/ApiError');
const { Project, Proposal } = require('../../models');

class PublicationService {
  async listByProject(projectId, tenantId = null) {
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');
    return publicationRepository.findByProject(projectId, tenantId);
  }

  async getById(id, tenantId = null) {
    const pub = await publicationRepository.findById(id, tenantId);
    if (!pub) throw ApiError.notFound('Publication');
    return pub;
  }

  async create(projectId, data, user) {
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');

    const payload = {
      ...data,
      project_id: projectId,
      organization_id: project.organization_id,
      created_by: user.id,
    };
    if (data.proposal_id) {
      const proposal = await Proposal.findByPk(data.proposal_id, { attributes: ['task_id'] });
          if (proposal?.task_id) payload.task_id = proposal.task_id;
    }
    return publicationRepository.create(payload);
  }

  async update(id, data) {
    const pub = await publicationRepository.findById(id);
    if (!pub) throw ApiError.notFound('Publication');
    const payload = { ...data };
    if (data.proposal_id !== undefined) {
      if (data.proposal_id) {
        const proposal = await Proposal.findByPk(data.proposal_id, { attributes: ['task_id'] });
        if (proposal?.task_id) payload.task_id = proposal.task_id;
      } else {
        payload.task_id = null;
      }
    }
    return publicationRepository.update(id, payload);
  }

  async delete(id) {
    const pub = await publicationRepository.delete(id);
    if (!pub) throw ApiError.notFound('Publication');
    return pub;
  }
}

module.exports = new PublicationService();
