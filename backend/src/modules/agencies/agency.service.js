'use strict';

const agencyRepository = require('./agency.repository');
const ApiError = require('../../utils/ApiError');

class AgencyService {
  async list() {
    return agencyRepository.findAll();
  }

  async getById(id) {
    const agency = await agencyRepository.findById(id);
    if (!agency) throw ApiError.notFound('Agence');
    return agency;
  }

  async create(data) {
    return agencyRepository.create(data);
  }

  async update(id, data) {
    const agency = await agencyRepository.update(id, data);
    if (!agency) throw ApiError.notFound('Agence');
    return agency;
  }

  async delete(id) {
    const agency = await agencyRepository.delete(id);
    if (!agency) throw ApiError.notFound('Agence');
    return agency;
  }
}

module.exports = new AgencyService();
