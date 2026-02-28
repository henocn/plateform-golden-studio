'use strict';

const { User } = require('../../models');
const { Op } = require('sequelize');

class UserRepository {
  /* Récupère les utilisateurs internes (user_type = 'internal') */
  async findInternalUsers({ search, role, is_active, page, limit, offset } = {}) {
    const where = { user_type: 'internal' };

    if (role) where.role = role;
    if (typeof is_active === 'boolean') where.is_active = is_active;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère les utilisateurs clients (user_type = 'client') */
  async findClientUsers({ search, role, is_active, page, limit, offset } = {}) {
    const where = { user_type: 'client' };

    if (role) where.role = role;
    if (typeof is_active === 'boolean') where.is_active = is_active;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère un utilisateur par son ID */
  async findById(id) {
    return User.findByPk(id);
  }

  /* Récupère un utilisateur par son email */
  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  /* Crée un utilisateur */
  async create(data) {
    return User.create(data);
  }

  /* Met à jour un utilisateur */
  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  /* Met à jour le rôle d'un utilisateur */
  async updateRole(id, role) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update({ role });
  }

  /* Met à jour le statut d'un utilisateur */
  async updateStatus(id, isActive) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update({ is_active: isActive });
  }

  /* Désactive un utilisateur (soft delete) */
  async deactivate(id) {
    return this.updateStatus(id, false);
  }
}

module.exports = new UserRepository();
