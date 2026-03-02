'use strict';

const projectRepository = require('./project.repository');
const ApiError = require('../../utils/ApiError');
const { Direction } = require('../../models');

class ProjectService {
  async list(filters) {
    return projectRepository.findAll(filters);
  }

  async getById(id) {
    const project = await projectRepository.findById(id);
    if (!project) throw ApiError.notFound('Projet');
    return project;
  }

  async _validateAgencyDirection(agencyId, directionId) {
    if (!directionId) return;
    const direction = await Direction.findByPk(directionId);
    if (!direction) throw ApiError.badRequest('Direction invalide');
    const dirAgencyId = direction.agency_id || null;
    const projAgencyId = agencyId || null;
    if (dirAgencyId !== projAgencyId) {
      throw ApiError.badRequest('La direction choisie ne correspond pas à l\'agence (ou au ministère).');
    }
  }

  async create(data, createdBy, user) {
    await this._validateAgencyDirection(data.agency_id, data.direction_id);
    return projectRepository.create({
      ...data,
      created_by: createdBy,
    });
  }

  async update(id, data) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw ApiError.notFound('Projet');
    const agencyId = data.agency_id !== undefined ? data.agency_id : existing.agency_id;
    const directionId = data.direction_id !== undefined ? data.direction_id : existing.direction_id;
    await this._validateAgencyDirection(agencyId, directionId);
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
