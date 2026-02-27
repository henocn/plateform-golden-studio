"use strict";

const env = require("../../config/env");
const organizationRepository = require("./organization.repository");
const ApiError = require("../../utils/ApiError");

/**
 * Organization Service — business logic (single-organization mode supported)
 */
class OrganizationService {
  /**
   * Get the current (single) organization for branding (logo, name).
   */
  async getCurrent() {
    const singleId = env.SINGLE_ORGANIZATION_ID || null;
    const organization = await organizationRepository.findCurrent(singleId);
    if (!organization) throw ApiError.notFound('Organisation');
    return organization;
  }

  /**
   * List all organizations (with filters + pagination)
   */
  async list(filters) {
    return organizationRepository.findAll(filters);
  }

  /**
   * Get organization by ID
   */
  async getById(id) {
    const organization = await organizationRepository.findById(id);
    if (!organization) throw ApiError.notFound('Organisation');
    return organization;
  }

  /**
   * Create organization
   */
  async create(data, createdBy) {
    return organizationRepository.create({
      ...data,
      created_by: createdBy,
    });
  }

  /**
   * Update organization
   */
  async update(id, data) {
    const organization = await organizationRepository.update(id, data);
    if (!organization) throw ApiError.notFound('Organisation');
    return organization;
  }

  /**
   * Activate / deactivate organization
   */
  async updateStatus(id, isActive) {
    const organization = await organizationRepository.updateStatus(
      id,
      isActive,
    );
    if (!organization) throw ApiError.notFound('Organisation');
    return organization;
  }

  /**
   * Get users of a specific organization
   */
  async getUsers(organizationId, pagination) {
    // Verify org exists first
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organisation');

    return organizationRepository.findUsers(organizationId, pagination);
  }

  /**
   * Get projects of a specific organization
   */
  async getProjects(organizationId, pagination) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organisation');

    return organizationRepository.findProjects(organizationId, pagination);
  }

  /**
   * Get stats for a specific organization
   */
  async getStats(organizationId) {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw ApiError.notFound('Organisation');

    return organizationRepository.getStats(organizationId);
  }

  /**
   * Delete organization
   */
  async remove(id) {
    const organization = await organizationRepository.remove(id);
    if (!organization) throw ApiError.notFound('Organisation');
    return organization;
  }
}

module.exports = new OrganizationService();
