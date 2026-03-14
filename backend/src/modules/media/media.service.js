'use strict';

const mediaRepository = require('./media.repository');
const ApiError = require('../../utils/ApiError');
const path = require('path');
const env = require('../../config/env');

class MediaService {
  async list(filters) {
    return mediaRepository.findAll(filters);
  }

  async getById(id) {
    const media = await mediaRepository.findById(id);
    if (!media) throw ApiError.notFound('Média');
    return media;
  }

  async create(data, file, user) {
    return mediaRepository.create({
      ...data,
      file_path: path
        .relative(env.UPLOAD_DIR, file.path)
        .split(path.sep)
        .join('/'),
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_by: user.id,
      folder_id: data.folder_id || null,
    });
  }

  async update(id, data) {
    const media = await mediaRepository.update(id, data);
    if (!media) throw ApiError.notFound('Média');
    return media;
  }

  async delete(id) {
    const media = await mediaRepository.delete(id);
    if (!media) throw ApiError.notFound('Média');
    return media;
  }

  async getDownload(id) {
    const media = await mediaRepository.findById(id);
    if (!media) throw ApiError.notFound('Média');
    return media;
  }
}

module.exports = new MediaService();
