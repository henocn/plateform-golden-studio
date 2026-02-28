'use strict';

const { Agency } = require('../../models');

class AgencyRepository {
  async findAll() {
    return Agency.findAll({
      order: [['name', 'ASC']],
      include: [{ association: 'directions', attributes: ['id', 'name', 'code', 'agency_id'] }],
    });
  }

  async findById(id) {
    return Agency.findByPk(id, {
      include: [{ association: 'directions', attributes: ['id', 'name', 'code', 'agency_id'] }],
    });
  }

  async create(data) {
    return Agency.create(data);
  }

  async update(id, data) {
    const agency = await Agency.findByPk(id);
    if (!agency) return null;
    return agency.update(data);
  }

  async delete(id) {
    const agency = await Agency.findByPk(id);
    if (!agency) return null;
    await agency.destroy();
    return agency;
  }
}

module.exports = new AgencyRepository();
