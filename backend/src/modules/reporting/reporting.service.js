'use strict';

const { Project, Task, Proposal, Publication, Validation, User, Organization } = require('../../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class ReportingService {
  /**
   * Overview KPIs — global for internal, org-scoped for client
   */
  async getOverview(user) {
    const isClient = user.user_type === 'client';
    const orgWhere = isClient ? { organization_id: user.organization_id } : {};

    const [totalProjects, totalTasks, totalProposals, totalPublications] = await Promise.all([
      Project.count({ where: { ...orgWhere, status: { [Op.ne]: 'archived' } } }),
      Task.count({ where: orgWhere }),
      Proposal.count({ where: orgWhere }),
      Publication.count({ where: orgWhere }),
    ]);

    return {
      total_projects: totalProjects,
      total_tasks: totalTasks,
      total_proposals: totalProposals,
      total_publications: totalPublications,
    };
  }

  /**
   * Project stats
   */
  async getProjectStats(user) {
    const isClient = user.user_type === 'client';
    const orgWhere = isClient ? { organization_id: user.organization_id } : {};

    const byStatus = await Project.findAll({
      where: orgWhere,
      attributes: [
        'status',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const byPriority = await Project.findAll({
      where: { ...orgWhere, status: { [Op.ne]: 'archived' } },
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
   * User stats — internal admin+ only
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
   * Publication stats — by channel, adapted to tenant
   */
  async getPublicationStats(user) {
    const isClient = user.user_type === 'client';
    const orgWhere = isClient ? { organization_id: user.organization_id } : {};

    const byChannel = await Publication.findAll({
      where: orgWhere,
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
   * Validation stats
   */
  async getValidationStats(user) {
    const isClient = user.user_type === 'client';
    const orgWhere = isClient ? { organization_id: user.organization_id } : {};

    const byStatus = await Validation.findAll({
      where: orgWhere,
      attributes: [
        'status',
        [Validation.sequelize.fn('COUNT', Validation.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const total = await Validation.count({ where: orgWhere });

    return {
      total,
      by_status: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
    };
  }
}

module.exports = new ReportingService();
