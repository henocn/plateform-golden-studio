'use strict';

const directionRepository = require('./direction.repository');
const ApiError = require('../../utils/ApiError');

class DirectionService {
  async list(filters = {}) {
    const agencyId = filters.agency_id;
    return directionRepository.findAll({
      agencyId: agencyId === '' ? null : agencyId,
    });
  }

  async getById(id) {
    const direction = await directionRepository.findById(id);
    if (!direction) throw ApiError.notFound('Direction');
    return direction;
  }

  async create(data) {
    return directionRepository.create(data);
  }

  async update(id, data) {
    const direction = await directionRepository.update(id, data);
    if (!direction) throw ApiError.notFound('Direction');
    return direction;
  }

  async delete(id) {
    const direction = await directionRepository.delete(id);
    if (!direction) throw ApiError.notFound('Direction');
    return direction;
  }
}

module.exports = new DirectionService();
