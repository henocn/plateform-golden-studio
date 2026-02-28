"use strict";

const { Organization, User, Project } = require("../../models");
const { Op } = require("sequelize");

class OrganizationRepository {
  /* Récupère toutes les organisations avec filtres */
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

  /* Récupère l'organisation courante (mode mono-organisation) */
  async findCurrent(singleOrgId = null) {
    if (singleOrgId) {
      const org = await Organization.findOne({
        where: { id: singleOrgId, is_active: true },
        attributes: ['id', 'name', 'short_name', 'logo_path', 'contact_email', 'contact_phone', 'address', 'type'],
      });
      return org;
    }
    return Organization.findOne({
      where: { is_active: true },
      order: [['created_at', 'ASC']],
      attributes: ['id', 'name', 'short_name', 'logo_path', 'contact_email', 'contact_phone', 'address', 'type'],
    });
  }

  /* Récupère une organisation par son ID */
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

  /* Crée une organisation */
  async create(data) {
    return Organization.create(data);
  }

  /* Met à jour une organisation */
  async update(id, data) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    return organization.update(data);
  }

  /* Bascule le statut actif/inactif */
  async updateStatus(id, isActive) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    return organization.update({ is_active: isActive });
  }

  /* Récupère les utilisateurs (sans filtre par organisation) */
  async findUsers({ page = 1, limit = 20, offset = 0 } = {}) {
    const { rows, count } = await User.findAndCountAll({
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère les projets (sans filtre par organisation) */
  async findProjects({ page = 1, limit = 20, offset = 0 } = {}) {
    const { rows, count } = await Project.findAndCountAll({
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Statistiques globales */
  async getStats() {
    const [usersCount, projectsCount, activeProjectsCount] = await Promise.all([
      User.count(),
      Project.count(),
      Project.count({
        where: {
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

  /* Supprime une organisation */
  async remove(id) {
    const organization = await Organization.findByPk(id);
    if (!organization) return null;
    await organization.destroy();
    return organization;
  }
}

module.exports = new OrganizationRepository();
