'use strict';

const { AuditLog } = require('../../models');
const { Op } = require('sequelize');

class AuditRepository {
  async findAll({ userId, organizationId, action, entityType, startDate, endDate, search, page, limit, offset } = {}) {
    const where = {};

    if (userId) where.user_id = userId;
    if (organizationId) where.organization_id = organizationId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.created_at = { [Op.lte]: new Date(endDate) };
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'organization', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  async findById(id) {
    return AuditLog.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { association: 'organization', attributes: ['id', 'name'] },
      ],
    });
  }
}

module.exports = new AuditRepository();
