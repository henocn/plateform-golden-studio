'use strict';

const folderRepository = require('./folder.repository');
const ApiError = require('../../utils/ApiError');
const { Media, Folder } = require('../../models');

class FolderService {
  /**
   * Liste les dossiers. Mono-organisation : tous les dossiers visibles.
   */
  async list(filters) {
    return folderRepository.findAll(filters);
  }

  /**
   * Récupère tous les dossiers racine. Mono-organisation : visibles par tous.
   */
  async getRootFolders() {
    return folderRepository.findRootFolders();
  }

  /**
   * Explore un dossier : retourne sous-dossiers + fichiers.
   */
  async explore(folderId) {
    const folder = await folderRepository.findById(folderId);
    if (!folder) throw ApiError.notFound('Dossier');
    return folderRepository.explore(folderId);
  }

  async getById(id) {
    const folder = await folderRepository.findById(id);
    if (!folder) throw ApiError.notFound('Dossier');
    return folder;
  }

  /**
   * Crée un dossier (racine ou sous-dossier). Une seule permission : folders.create.
   * Toute personne ayant le droit peut créer partout (racine ou sous-dossier).
   */
  async create(data, user, tenantId) {
    let organizationId = data.organization_id;
    if (data.parent_id) {
      const parentFolder = await folderRepository.findById(data.parent_id);
      if (!parentFolder) throw ApiError.notFound('Dossier parent');
      organizationId = parentFolder.organization_id;
    } else {
      organizationId = organizationId || (user.user_type === 'client' ? user.organization_id : tenantId || user.organization_id);
    }

    return folderRepository.create({
      name: data.name,
      parent_id: data.parent_id || null,
      organization_id: organizationId,
      created_by: user.id,
    });
  }

  async update(id, data) {
    const folder = await folderRepository.findById(id);
    if (!folder) throw ApiError.notFound('Dossier');
    if (data.parent_id !== undefined && data.parent_id !== folder.parent_id && data.parent_id != null) {
      const newParent = await folderRepository.findById(data.parent_id);
      if (!newParent) throw ApiError.notFound('Dossier parent');
    }
    return folderRepository.update(id, data);
  }

  async delete(id) {
    const folder = await folderRepository.findById(id);
    if (!folder) throw ApiError.notFound('Dossier');

    // Suppression récursive : récupérer tous les sous-dossiers (arborescence complète)
    const idsToDelete = [id];
    const queue = [id];

    // Parcours en largeur pour collecter tous les descendants
    // On reste en JS ici pour éviter d'introduire une requête SQL récursive spécifique à Postgres.
    // Pour un nombre raisonnable de dossiers, c'est suffisant.
    // Si l'arborescence devenait très profonde, on pourrait basculer vers une CTE récursive.
    while (queue.length > 0) {
      const currentId = queue.shift();
      // On ne récupère que les identifiants pour limiter la charge
      // eslint-disable-next-line no-await-in-loop
      const children = await Folder.findAll({
        where: { parent_id: currentId },
        attributes: ['id'],
      });
      for (const child of children) {
        idsToDelete.push(child.id);
        queue.push(child.id);
      }
    }

    // Supprimer tous les médias contenus dans ces dossiers
    await Media.destroy({
      where: { folder_id: idsToDelete },
    });

    // Supprimer tous les dossiers (le dossier courant + ses descendants)
    await Folder.destroy({
      where: { id: idsToDelete },
    });

    return folder;
  }
}

module.exports = new FolderService();
