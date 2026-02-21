'use strict';

const { Media } = require('../../models');
const { Op } = require('sequelize');

class MediaRepository {
  async findAll({ tenantId, type, isGlobal, search, tags, folder_id, page, limit, offset } = {}) {
    const where = {};

    // Client sees: global media + their org media
    // Internal sees: all
    if (tenantId) {
      where[Op.or] = [
        { is_global: true },
        { organization_id: tenantId },
      ];
    }
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
    if (folder_id !== undefined) {
      where.folder_id = folder_id;
    }

    const { rows, count } = await Media.findAndCountAll({
      where,
      include: [
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'folder', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  async findById(id) {
    return Media.findByPk(id, {
      include: [
        { association: 'organization', attributes: ['id', 'name'] },
        { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'folder', attributes: ['id', 'name'] },
      ],
    });
  }

  async create(data) {
    return Media.create(data);
  }

  async update(id, data) {
    const media = await Media.findByPk(id);
    if (!media) return null;
    return media.update(data);
  }

  async delete(id) {
    const media = await Media.findByPk(id);
    if (!media) return null;
    await media.destroy();
    return media;
  }
}

module.exports = new MediaRepository();
