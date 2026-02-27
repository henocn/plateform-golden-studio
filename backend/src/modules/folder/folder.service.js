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
   * Liste les dossiers avec filtrage tenant
   */
  async list(filters, user, tenantId) {
    if (user.user_type === 'client') {
      filters.tenantId = user.organization_id;
    } else {
      filters.tenantId = tenantId || null;
    }
    return folderRepository.findAll(filters);
  }

  /**
   * Récupère les dossiers racine d'une organisation
   * TODO: réactiver le contrôle d'accès (forbidden si client et organizationId !== user.organization_id)
   */
  async getRootFolders(organizationId, user, tenantId) {
    // Accès temporairement ouvert à tous les utilisateurs connectés
    const targetOrgId = user.user_type === 'internal' && tenantId ? tenantId : organizationId;
    return folderRepository.findRootFolders(targetOrgId);
  }

  /**
   * Explore un dossier : retourne sous-dossiers + fichiers
   * TODO: réactiver le contrôle d'accès (forbidden si client et folder.organization_id !== user.organization_id)
   */
  async explore(folderId, user, tenantId) {
    // Temporairement: trouver le dossier sans filtrer par org pour éviter 403
    const folder = await folderRepository.findById(folderId, null);
    if (!folder) throw ApiError.notFound('Dossier');

    const targetTenantId = user.user_type === 'client' ? user.organization_id : tenantId;
    return folderRepository.explore(folderId, targetTenantId);
  }

  /**
   * TODO: réactiver le contrôle d'accès (forbidden si client et folder.organization_id !== user.organization_id)
   */
  async getById(id, user, tenantId) {
    const folder = await folderRepository.findById(id, null);
    if (!folder) throw ApiError.notFound('Dossier');
    return folder;
  }

  /**
   * Crée un dossier (racine ou sous-dossier)
   * Les droits sont gérés via les permissions :
   * - folders.create_root  → rôles autorisés à créer un dossier racine
   * - folders.create_subfolder → rôles autorisés à créer un sous-dossier
   */
  async create(data, user, tenantId) {
    const isRootFolder = !data.parent_id;

    // Le contrôle fin par rôle est géré par les permissions sur la route (folders.create_root / folders.create_subfolder)

    // Déterminer l'organization_id
    let organizationId;
    if (isRootFolder) {
      // Super_admin peut spécifier l'organisation pour un dossier racine
      organizationId = data.organization_id || (user.user_type === 'client' ? user.organization_id : tenantId || user.organization_id);
    } else {
      // Pour un sous-dossier, vérifier que le parent existe et appartient à la bonne org
      const parentFolder = await folderRepository.findById(data.parent_id);
      if (!parentFolder) {
        throw ApiError.notFound('Dossier parent');
      }

      // Vérifier l'accès au parent
      if (user.user_type === 'client' && parentFolder.organization_id !== user.organization_id) {
        throw ApiError.forbidden('Cannot create subfolder in another organization');
      }

      // Si super_admin crée un sous-dossier, il peut spécifier l'org, sinon utiliser celle du parent
        organizationId = parentFolder.organization_id;
    }

    return folderRepository.create({
      name: data.name,
      parent_id: data.parent_id || null,
      organization_id: organizationId,
      is_global: data.is_global || false,
      created_by: user.id,
    });
  }

  /**
   * TODO: réactiver le contrôle d'accès (forbidden si client et folder.organization_id !== user.organization_id)
   */
  async update(id, data, user, tenantId) {
    const folder = await folderRepository.findById(id, null);
    if (!folder) throw ApiError.notFound('Dossier');

    // Si on change le parent_id, vérifier que le nouveau parent existe et appartient à la même org
    if (data.parent_id !== undefined && data.parent_id !== folder.parent_id) {
        if (data.parent_id === null) {
        // Tenter de passer en racine : le contrôle de permission est fait au niveau route
      } else {
        const newParent = await folderRepository.findById(data.parent_id);
        if (!newParent) {
          throw ApiError.notFound('Dossier parent');
        }
        if (newParent.organization_id !== folder.organization_id) {
          throw ApiError.forbidden('Cannot move folder to another organization');
        }
      }
    }

    return folderRepository.update(id, data);
  }

  /**
   * TODO: réactiver le contrôle d'accès (forbidden si client et folder.organization_id !== user.organization_id)
   */
  async delete(id, user, tenantId) {
    const folder = await folderRepository.findById(id, null);
    if (!folder) throw ApiError.notFound('Folder');

    // Déplacer les médias du dossier vers la racine (folder_id = null)
    await Media.update({ folder_id: null }, { where: { folder_id: id } });
    // Remonter les sous-dossiers au niveau du parent (ou racine si parent_id = null)
    await Folder.update({ parent_id: folder.parent_id }, { where: { parent_id: id } });

    return folderRepository.delete(id);
  }
}

module.exports = new FolderService();
