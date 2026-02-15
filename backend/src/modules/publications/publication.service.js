'use strict';

const publicationRepository = require('./publication.repository');
const ApiError = require('../../utils/ApiError');
const { Project } = require('../../models');

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

    return publicationRepository.create({
      ...data,
      project_id: projectId,
      organization_id: project.organization_id,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const pub = await publicationRepository.update(id, data);
    if (!pub) throw ApiError.notFound('Publication');
    return pub;
  }

  async delete(id) {
    const pub = await publicationRepository.delete(id);
    if (!pub) throw ApiError.notFound('Publication');
    return pub;
  }
}

module.exports = new PublicationService();
