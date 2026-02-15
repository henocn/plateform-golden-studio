'use strict';

const projectRepository = require('./project.repository');
const ApiError = require('../../utils/ApiError');

class ProjectService {
  async list(filters) {
    return projectRepository.findAll(filters);
  }

  async getById(id, tenantId = null) {
    const project = await projectRepository.findById(id, tenantId);
    if (!project) throw ApiError.notFound('Project');
    return project;
  }

  async create(data, createdBy) {
    return projectRepository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async update(id, data, tenantId = null) {
    const project = await projectRepository.update(id, data, tenantId);
    if (!project) throw ApiError.notFound('Project');
    return project;
  }

  async updateStatus(id, status) {
    const project = await projectRepository.updateStatus(id, status);
    if (!project) throw ApiError.notFound('Project');
    return project;
  }

  async archive(id) {
    const project = await projectRepository.delete(id);
    if (!project) throw ApiError.notFound('Project');
    return project;
  }

  async getDashboardStats(tenantId = null) {
    return projectRepository.getDashboardStats(tenantId);
  }
}

module.exports = new ProjectService();
