'use strict';

const { AuditLog } = require('../../models');
const { Op } = require('sequelize');

class AuditRepository {
  /* Récupère tous les logs d'audit avec filtres */
  async findAll({ userId, action, entityType, startDate, endDate, search, page, limit, offset } = {}) {
    const where = {};

    if (userId) where.user_id = userId;
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
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère un log d'audit par son ID */
  async findById(id) {
    return AuditLog.findByPk(id, {
      include: [
        { association: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });
  }
}

module.exports = new AuditRepository();
