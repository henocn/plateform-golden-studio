'use strict';

const auditRepository = require('./audit.repository');
const ApiError = require('../../utils/ApiError');

class AuditService {
  async list(filters) {
    return auditRepository.findAll(filters);
  }

  async getById(id) {
    const log = await auditRepository.findById(id);
    if (!log) throw ApiError.notFound('Audit log');
    return log;
  }
}

module.exports = new AuditService();
