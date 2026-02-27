'use strict';

const projectRepository = require('./project.repository');
const { Organization } = require('../../models');
const ApiError = require('../../utils/ApiError');

class ProjectService {
  async resolveOrganizationId(data, user) {
    if (data.organization_id) return data.organization_id;
    // Clients : toujours leur organisation
    if (user?.user_type === 'client' && user.organization_id) {
      return user.organization_id;
    }
    // Internes : on prend l'organisation courante (mode mono-org)
    const org = await Organization.findOne({
      where: { is_active: true },
      order: [['created_at', 'ASC']],
      attributes: ['id'],
    });
    if (!org) throw ApiError.badRequest('Aucune organisation active configurée');
    return org.id;
  }
  async list(filters) {
    return projectRepository.findAll(filters);
  }

  async getById(id, tenantId = null) {
    const project = await projectRepository.findById(id, tenantId);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async create(data, createdBy, user) {
    const organization_id = await this.resolveOrganizationId(data, user);
    return projectRepository.create({
      ...data,
      organization_id,
      created_by: createdBy,
    });
  }

  async update(id, data, tenantId = null) {
    const project = await projectRepository.update(id, data, tenantId);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async updateStatus(id, status) {
    const project = await projectRepository.updateStatus(id, status);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async archive(id) {
    const project = await projectRepository.delete(id, false);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async delete(id) {
    const project = await projectRepository.delete(id, true);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async getDashboardStats(tenantId = null) {
    return projectRepository.getDashboardStats(tenantId);
  }
}

module.exports = new ProjectService();
