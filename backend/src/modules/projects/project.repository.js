'use strict';

const { Project, User } = require('../../models');
const { Op } = require('sequelize');

class ProjectRepository {
  /* Récupère tous les projets avec filtres */
  async findAll({ status, priority, search, page, limit, offset } = {}) {
    const where = {};

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
        { association: 'internalManager', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'clientContact', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère un projet par son ID avec toutes les associations */
  async findById(id) {
    const where = { id };

    return Project.findOne({
      where,
      include: [
        { association: 'internalManager', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'clientContact', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
  }

  /* Crée un projet */
  async create(data) {
    return Project.create(data);
  }

  /* Met à jour un projet */
  async update(id, data) {
    const project = await Project.findOne({ where: { id } });
    if (!project) return null;
    return project.update(data);
  }

  /* Met à jour le statut d'un projet */
  async updateStatus(id, status) {
    const project = await Project.findByPk(id);
    if (!project) return null;
    return project.update({ status });
  }

  /* Supprime un projet (soft ou hard delete) */
  async delete(id, hardDelete = false) {
    const project = await Project.findByPk(id);
    if (!project) return null;
    if (hardDelete) {
      await project.destroy();
      return project;
    }
    return project.update({ status: 'archived' });
  }

  /* Statistiques du tableau de bord */
  async getDashboardStats() {
    const where = {};

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
