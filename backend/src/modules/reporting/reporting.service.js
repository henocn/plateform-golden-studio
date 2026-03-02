'use strict';

const { Project, Task, Proposal, Publication, Validation, User } = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');


class ReportingService {
  /**
   * Overview KPIs globaux
   */
  async getOverview(user) {
    const [
      totalProjects,
      activeProjects,
      pendingValidation,
      completedProjects,
      totalTasks,
      totalProposals,
      totalPublications,
      scheduledPublications,
    ] = await Promise.all([
      Project.count(),
      Project.count({ where: { status: { [Op.in]: ['brief_received', 'in_production'] } } }),
      Project.count({ where: { status: 'in_validation' } }),
      Project.count({ where: { status: 'published' } }),
      Task.count(),
      Proposal.count(),
      Publication.count(),
      Publication.count({ where: { status: 'scheduled' } }),
    ]);

    return {
      total_projects: totalProjects,
      active_projects: activeProjects,
      pending_validation: pendingValidation,
      completed_projects: completedProjects,
      total_tasks: totalTasks,
      total_proposals: totalProposals,
      total_publications: totalPublications,
      scheduled_publications: scheduledPublications,
    };
  }

  /**
   * Statistiques des projets par statut et priorité
   */
  async getProjectStats(user) {
    const byStatus = await Project.findAll({
      attributes: [
        'status',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const byPriority = await Project.findAll({
      where: { status: { [Op.ne]: 'archived' } },
      attributes: [
        'priority',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
      ],
      group: ['priority'],
      raw: true,
    });

    return {
      by_status: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      by_priority: byPriority.reduce((acc, r) => { acc[r.priority] = parseInt(r.count, 10); return acc; }, {}),
    };
  }

  /**
   * Statistiques utilisateurs (admin+ uniquement)
   */
  async getUserStats() {
    const byType = await User.findAll({
      attributes: [
        'user_type',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
      ],
      group: ['user_type'],
      raw: true,
    });

    const byRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    const totalActive = await User.count({ where: { is_active: true } });

    return {
      by_type: byType.reduce((acc, r) => { acc[r.user_type] = parseInt(r.count, 10); return acc; }, {}),
      by_role: byRole.reduce((acc, r) => { acc[r.role] = parseInt(r.count, 10); return acc; }, {}),
      total_active: totalActive,
    };
  }

  /**
   * Statistiques des publications par canal
   */
  async getPublicationStats(user) {
    const byChannel = await Publication.findAll({
      attributes: [
        'channel',
        [Publication.sequelize.fn('COUNT', Publication.sequelize.col('id')), 'count'],
      ],
      group: ['channel'],
      raw: true,
    });

    return {
      by_channel: byChannel.reduce((acc, r) => { acc[r.channel] = parseInt(r.count, 10); return acc; }, {}),
    };
  }

  /**
   * Statistiques des validations par statut
   */
  async getValidationStats(user) {
    const byStatus = await Validation.findAll({
      attributes: [
        'status',
        [Validation.sequelize.fn('COUNT', Validation.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const total = await Validation.count();

    return {
      total,
      by_status: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
    };
  }
}

module.exports = new ReportingService();
