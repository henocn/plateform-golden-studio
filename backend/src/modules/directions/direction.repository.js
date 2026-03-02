'use strict';

const { Direction } = require('../../models');
const { Op } = require('sequelize');

class DirectionRepository {
  async findAll({ agencyId } = {}) {
    const where = {};
    if (agencyId === null || agencyId === 'null' || agencyId === '') {
      where.agency_id = { [Op.is]: null };
    } else if (agencyId) {
      where.agency_id = agencyId;
    }

    return Direction.findAll({
      where,
      order: [['name', 'ASC']],
      include: [{ association: 'agency', attributes: ['id', 'name', 'code'], required: false }],
    });
  }

  async findById(id) {
    return Direction.findByPk(id, {
      include: [{ association: 'agency', attributes: ['id', 'name', 'code'], required: false }],
    });
  }

  async create(data) {
    return Direction.create(data);
  }

  async update(id, data) {
    const direction = await Direction.findByPk(id);
    if (!direction) return null;
    return direction.update(data);
  }

  async delete(id) {
    const direction = await Direction.findByPk(id);
    if (!direction) return null;
    await direction.destroy();
    return direction;
  }
}

module.exports = new DirectionRepository();
