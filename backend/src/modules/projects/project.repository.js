'use strict';

const { Project, Organization, User } = require('../../models');
const { Op } = require('sequelize');

class ProjectRepository {
  /**
   * Find all projects with tenant filtering + filters
   */
  async findAll({ tenantId, status, priority, search, page, limit, offset } = {}) {
    const where = {};

    if (tenantId) where.organization_id = tenantId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Project.findAndCountAll({
      where,
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name'] },
        { association: 'internalManager', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'studioManager', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'clientContact', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Find by ID with all associations
   */
  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    return Project.findOne({
      where,
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name', 'type'] },
        { association: 'internalManager', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'studioManager', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'clientContact', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  async create(data) {
    return Project.create(data);
  }

  async update(id, data, tenantId = null) {
    const where = { id };
    if (tenantId) where.organization_id = tenantId;

    const project = await Project.findOne({ where });
    if (!project) return null;
    return project.update(data);
  }

  async updateStatus(id, status) {
    const project = await Project.findByPk(id);
    if (!project) return null;
    return project.update({ status });
  }

  async delete(id, hardDelete = false) {
    const project = await Project.findByPk(id);
    if (!project) return null;
    if (hardDelete) {
      await project.destroy();
      return project;
    }
    return project.update({ status: 'archived' });
  }

  /**
   * Dashboard stats — adapted by tenantId
   */
  async getDashboardStats(tenantId = null) {
    const where = {};
    if (tenantId) where.organization_id = tenantId;

    const [total, byStatus, byPriority] = await Promise.all([
      Project.count({ where }),
      Project.findAll({
        where,
        attributes: [
          'status',
          [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }),
      Project.findAll({
        where: { ...where, status: { [Op.ne]: 'archived' } },
        attributes: [
          'priority',
          [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
        ],
        group: ['priority'],
        raw: true,
      }),
    ]);

    return {
      total,
      by_status: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      by_priority: byPriority.reduce((acc, r) => { acc[r.priority] = parseInt(r.count, 10); return acc; }, {}),
    };
  }
}

module.exports = new ProjectRepository();
