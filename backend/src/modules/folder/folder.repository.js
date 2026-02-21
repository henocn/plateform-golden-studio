'use strict';

const { Folder } = require('../../models');
const { Op } = require('sequelize');

class FolderRepository {
  async findAll({ tenantId, search, parent_id, page, limit, offset } = {}) {
    const where = {};
    if (tenantId) {
      where.organization_id = tenantId;
    }
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }
    const { rows, count } = await Folder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }

  async findById(id) {
    return Folder.findByPk(id);
  }

  async create(data) {
    return Folder.create(data);
  }

  async update(id, data) {
    const folder = await Folder.findByPk(id);
    if (!folder) return null;
    await folder.update(data);
    return folder;
  }

  async delete(id) {
    const folder = await Folder.findByPk(id);
    if (!folder) return null;
    await folder.destroy();
    return folder;
  }
}

module.exports = new FolderRepository();
