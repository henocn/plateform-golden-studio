'use strict';

const mediaRepository = require('./media.repository');
const ApiError = require('../../utils/ApiError');

class MediaService {
  async list(filters, user) {
    const isClient = user.user_type === 'client';
    if (isClient) {
      filters.tenantId = user.organization_id;
    }
    // folder_id can be passed in filters
    return mediaRepository.findAll(filters);
  }

  async getById(id, user) {
    const media = await mediaRepository.findById(id);
    if (!media) throw ApiError.notFound('Media');
    // Client can only see global or own org media
    if (user.user_type === 'client') {
      if (!media.is_global && media.organization_id !== user.organization_id) {
        throw ApiError.notFound('Media');
      }
    }
    return media;
  }

  async create(data, file, user) {
    return mediaRepository.create({
      ...data,
      file_path: file.path,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: user.id,
      folder_id: data.folder_id || null,
    });
  }

  async update(id, data) {
    const media = await mediaRepository.update(id, data);
    if (!media) throw ApiError.notFound('Media');
    return media;
  }

  async delete(id) {
    const media = await mediaRepository.delete(id);
    if (!media) throw ApiError.notFound('Media');
    return media;
  }

  /**
   * Download — ensure access control
   */
  async getDownload(id, user) {
    const media = await mediaRepository.findById(id);
    if (!media) throw ApiError.notFound('Media');
    if (user.user_type === 'client') {
      if (!media.is_global && media.organization_id !== user.organization_id) {
        throw ApiError.forbidden('Access denied to this media');
      }
    }
    return media;
  }
}

module.exports = new MediaService();
