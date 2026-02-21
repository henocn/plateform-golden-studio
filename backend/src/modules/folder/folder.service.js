'use strict';

const folderRepository = require('./folder.repository');
const ApiError = require('../../utils/ApiError');

class FolderService {
  async list(filters, user) {
    filters.tenantId = user.organization_id;
    return folderRepository.findAll(filters);
  }

  async getById(id, user) {
    const folder = await folderRepository.findById(id);
    if (!folder) throw ApiError.notFound('Folder');
    if (user.user_type === 'client' && folder.organization_id !== user.organization_id) {
      throw ApiError.notFound('Folder');
    }
    return folder;
  }

  async create(data, user) {
    return folderRepository.create({
      ...data,
      organization_id: user.organization_id,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const folder = await folderRepository.update(id, data);
    if (!folder) throw ApiError.notFound('Folder');
    return folder;
  }

  async delete(id) {
    const folder = await folderRepository.delete(id);
    if (!folder) throw ApiError.notFound('Folder');
    return folder;
  }
}

module.exports = new FolderService();
