'use strict';

const { Media } = require('../../models');
const { Op } = require('sequelize');

class MediaRepository {
  /* Récupère tous les médias avec filtres */
  async findAll({ type, isGlobal, search, tags, folder_id, page, limit, offset } = {}) {
    const where = {};
    if (type) where.type = type;
    if (isGlobal !== undefined) where.is_global = isGlobal === 'true' || isGlobal === true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { file_name: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (tags && tags.length > 0) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { [Op.overlap]: tagsArray };
    }
    if (folder_id !== undefined && folder_id !== null && folder_id !== '') {
      where.folder_id = folder_id;
    } else if (folder_id === null || folder_id === '') {
      where.folder_id = null;
    }

    const { rows, count } = await Media.findAndCountAll({
      where,
      include: [
        { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'folder', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  /* Récupère un média par son ID */
  async findById(id) {
    return Media.findByPk(id, {
      include: [
        { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'folder', attributes: ['id', 'name'] },
      ],
    });
  }

  /* Crée un média */
  async create(data) {
    return Media.create(data);
  }

  /* Met à jour un média */
  async update(id, data) {
    const media = await Media.findByPk(id);
    if (!media) return null;
    return media.update(data);
  }

  /* Supprime un média */
  async delete(id) {
    const media = await Media.findByPk(id);
    if (!media) return null;
    await media.destroy();
    return media;
  }
}

module.exports = new MediaRepository();
