"use strict";

const { Organization, User, Project } = require("../../models");
const { Op } = require("sequelize");

/**
 * Organization Repository — CRUD with tenant filtering support
 */
class OrganizationRepository {
  /**
   * Find all organizations with optional filters
   */
  async findAll({
    type,
    is_active,
    search,
    page = 1,
    limit = 20,
    offset = 0,
  } = {}) {
    const where = {};

    if (type) where.type = type;
    if (typeof is_active === "boolean") where.is_active = is_active;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { short_name: { [Op.iLike]: `%${search}%` } },
        { contact_email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Organization.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Find one by ID
   */
  async findById(id) {
    return Organization.findByPk(id, {
      include: [
        {
          association: "creator",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    });
  }

  /**
   * Create organization
   */
  async create(data) {
    return Organization.create(data);
  }

  /**
   * Update organization
   */
  async update(id, data) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    return organization.update(data);
  }

  /**
   * Toggle active status
   */
  async updateStatus(id, isActive) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    return organization.update({ is_active: isActive });
  }

  /**
   * Get users for an organization
   */
  async findUsers(organizationId, { page = 1, limit = 20, offset = 0 } = {}) {
    const { rows, count } = await User.findAndCountAll({
      where: { organization_id: organizationId },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Get projects for an organization
   */
  async findProjects(
    organizationId,
    { page = 1, limit = 20, offset = 0 } = {},
  ) {
    const { rows, count } = await Project.findAndCountAll({
      where: { organization_id: organizationId },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Get stats for an organization
   */
  async getStats(organizationId) {
    const [usersCount, projectsCount, activeProjectsCount] = await Promise.all([
      User.count({ where: { organization_id: organizationId } }),
      Project.count({ where: { organization_id: organizationId } }),
      Project.count({
        where: {
          organization_id: organizationId,
          status: { [Op.in]: ["in_production", "in_validation"] },
        },
      }),
    ]);

    return {
      total_users: usersCount,
      total_projects: projectsCount,
      active_projects: activeProjectsCount,
    };
  }

  /**
   * Delete organization
   */
  async remove(id) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    await organization.destroy();
    return organization;
  }
}

module.exports = new OrganizationRepository();
