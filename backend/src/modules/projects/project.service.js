'use strict';

const projectRepository = require('./project.repository');
const ApiError = require('../../utils/ApiError');

class ProjectService {
  /**
   * Liste tous les projets avec filtres
   */
  async list(filters) {
    return projectRepository.findAll(filters);
  }

  async getById(id) {
    const project = await projectRepository.findById(id);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  /**
   * Crée un nouveau projet
   */
  async create(data, createdBy, user) {
    return projectRepository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async update(id, data) {
    const project = await projectRepository.update(id, data);
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

  async getDashboardStats() {
    return projectRepository.getDashboardStats();
  }
}

module.exports = new ProjectService();
