'use strict';

const { User, Organization } = require('../../models');
const { Op } = require('sequelize');

/**
 * User Repository — CRUD with tenant filtering, separation internal/client
 */
class UserRepository {
  /**
   * Find internal users (user_type = 'internal')
   */
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

  /**
   * Find client users (user_type = 'client'), optionally filtered by tenant
   */
  async findClientUsers({ tenantId, search, role, is_active, organizationId, page, limit, offset } = {}) {
    const where = { user_type: 'client' };

    // Tenant isolation: if tenantId is set, force filter
    if (tenantId) {
      where.organization_id = tenantId;
    } else if (organizationId) {
      where.organization_id = organizationId;
    }

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
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /**
   * Find by ID
   */
  async findById(id) {
    return User.findByPk(id, {
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name', 'type'] },
      ],
    });
  }

  /**
   * Find by email
   */
  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  /**
   * Create user
   */
  async create(data) {
    return User.create(data);
  }

  /**
   * Update user
   */
  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  /**
   * Update role
   */
  async updateRole(id, role) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update({ role });
  }

  /**
   * Update status
   */
  async updateStatus(id, isActive) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update({ is_active: isActive });
  }

  /**
   * Soft delete (deactivate)
   */
  async deactivate(id) {
    return this.updateStatus(id, false);
  }
}

module.exports = new UserRepository();
