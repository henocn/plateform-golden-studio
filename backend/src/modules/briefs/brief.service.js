'use strict';

const briefRepository = require('./brief.repository');
const ApiError = require('../../utils/ApiError');
const { Project } = require('../../models');

class BriefService {
  /**
   * List briefs for a project
   */
  async listByProject(projectId, tenantId = null) {
    // Ensure project exists
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');
    return briefRepository.findByProject(projectId, tenantId);
  }

  async getById(id, tenantId = null) {
    const brief = await briefRepository.findById(id, tenantId);
    if (!brief) throw ApiError.notFound('Brief');
    return brief;
  }

  /**
   * Create brief — internal (contributor+) or client (client_contributor+)
   */
  async create(projectId, data, user) {
    const project = await Project.findByPk(projectId);
    if (!project) throw ApiError.notFound('Project');

    return briefRepository.create({
      ...data,
      project_id: projectId,
      organization_id: project.organization_id,
      submitted_by: user.id,
    });
  }

  /**
   * Update brief — internal only after client submission
   */
  async update(id, data, tenantId = null) {
    const brief = await briefRepository.update(id, data, tenantId);
    if (!brief) throw ApiError.notFound('Brief');
    return brief;
  }

  /**
   * Add attachment via multer
   */
  async addAttachment(briefId, file, user) {
    const brief = await briefRepository.findById(briefId);
    if (!brief) throw ApiError.notFound('Brief');

    return briefRepository.createAttachment({
      brief_id: briefId,
      organization_id: brief.organization_id,
      file_name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: user.id,
    });
  }

  async deleteAttachment(attachId) {
    const result = await briefRepository.deleteAttachment(attachId);
    if (!result) throw ApiError.notFound('Attachment');
    return result;
  }
}

module.exports = new BriefService();
