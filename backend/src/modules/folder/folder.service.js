'use strict';

/**
 * TODO: réactiver les contrôles d'accès par organisation (forbidden) pour
 * getRootFolders, explore, getById, update, delete — actuellement désactivés
 * pour permettre à tout utilisateur connecté (ex: admin client) de charger
 * et gérer les dossiers.
 */

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

    // Déplacer les médias du dossier vers la racine (folder_id = null)
    await Media.update({ folder_id: null }, { where: { folder_id: id } });
    // Remonter les sous-dossiers au niveau du parent (ou racine si parent_id = null)
    await Folder.update({ parent_id: folder.parent_id }, { where: { parent_id: id } });

    return folderRepository.delete(id);
  }
}

module.exports = new FolderService();
