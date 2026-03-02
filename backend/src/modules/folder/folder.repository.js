'use strict';

const { Folder, Media } = require('../../models');
const { Op } = require('sequelize');

class FolderRepository {
  /* Récupère tous les dossiers avec filtres */
  async findAll({ search, parent_id, page, limit, offset } = {}) {
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }
    const { rows, count } = await Folder.findAndCountAll({
      where,
      include: [
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { data: rows, total: count };
  }

  /* Récupère tous les dossiers racine (parent_id = null) */
  async findRootFolders() {
    return Folder.findAll({
      where: { parent_id: null },
      include: [
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /* Explore un dossier : retourne les sous-dossiers et fichiers */
  async explore(folderId) {
    const where = { folder_id: folderId };

    const [subfolders, media] = await Promise.all([
      Folder.findAll({
        where: { parent_id: folderId },
        include: [
          { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        ],
        order: [['name', 'ASC']],
      }),
      Media.findAll({
        where,
        include: [
          { association: 'uploader', attributes: ['id', 'first_name', 'last_name'] },
        ],
        order: [['name', 'ASC']],
      }),
    ]);

    return { subfolders, media };
  }

  /* Récupère un dossier par son ID */
  async findById(id) {
    return Folder.findOne({
      where: { id },
      include: [
        { association: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { association: 'parent', attributes: ['id', 'name'] },
      ],
    });
  }

  /* Crée un dossier */
  async create(data) {
    return Folder.create(data);
  }

  /* Met à jour un dossier */
  async update(id, data) {
    const folder = await Folder.findByPk(id);
    if (!folder) return null;
    await folder.update(data);
    return folder;
  }

  /* Supprime un dossier */
  async delete(id) {
    const folder = await Folder.findByPk(id);
    if (!folder) return null;
    await folder.destroy();
    return folder;
  }
}

module.exports = new FolderRepository();
