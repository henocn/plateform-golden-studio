'use strict';

const { Folder, Media } = require('../../models');
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
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }

  /**
   * Récupère les dossiers racine d'une organisation (parent_id = null)
   */
  async findRootFolders(organizationId) {
    return Folder.findAll({
      where: {
        organization_id: organizationId,
        parent_id: null,
      },
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Explore un dossier : retourne les sous-dossiers et fichiers
   */
  async explore(folderId, tenantId = null) {
    const where = { folder_id: folderId };
    if (tenantId) {
      where[Op.or] = [
        { is_global: true },
        { organization_id: tenantId },
      ];
    }

    const [subfolders, media] = await Promise.all([
      Folder.findAll({
        where: { parent_id: folderId },
        include: [
          { association: 'organization', attributes: ['id', 'name', 'short_name'] },
          { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        ],
        order: [['name', 'ASC']],
      }),
      Media.findAll({
        where,
        include: [
          { association: 'organization', attributes: ['id', 'name'] },
          { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        ],
        order: [['name', 'ASC']],
      }),
    ]);

    return { subfolders, media };
  }

  async findById(id, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.organization_id = tenantId;
    }
    return Folder.findOne({
      where,
      include: [
        { association: 'organization', attributes: ['id', 'name', 'short_name'] },
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'parent', attributes: ['id', 'name'] },
      ],
    });
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
