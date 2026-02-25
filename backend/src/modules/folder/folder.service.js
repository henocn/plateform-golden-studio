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
    if (!folder) throw ApiError.notFound('Folder');

    const targetTenantId = user.user_type === 'client' ? user.organization_id : tenantId;
    return folderRepository.explore(folderId, targetTenantId);
  }

  /**
   * TODO: réactiver le contrôle d'accès (forbidden si client et folder.organization_id !== user.organization_id)
   */
  async getById(id, user, tenantId) {
    const folder = await folderRepository.findById(id, null);
    if (!folder) throw ApiError.notFound('Folder');
    return folder;
  }

  /**
   * Crée un dossier (racine ou sous-dossier)
   * - Seul super_admin peut créer un dossier racine (parent_id = null)
   * - Super_admin peut créer un dossier racine pour n'importe quelle organisation
   * - Les autres peuvent créer des sous-dossiers dans leur organisation
   */
  async create(data, user, tenantId) {
    const isRootFolder = !data.parent_id;

    // Vérifier les droits pour créer un dossier racine
    if (isRootFolder && user.role !== 'super_admin') {
      throw ApiError.forbidden('Only super_admin can create root folders');
    }

    // Déterminer l'organization_id
    let organizationId;
    if (isRootFolder) {
      // Super_admin peut spécifier l'organisation pour un dossier racine
      organizationId = data.organization_id || (user.user_type === 'client' ? user.organization_id : tenantId || user.organization_id);
    } else {
      // Pour un sous-dossier, vérifier que le parent existe et appartient à la bonne org
      const parentFolder = await folderRepository.findById(data.parent_id);
      if (!parentFolder) {
        throw ApiError.notFound('Parent folder');
      }

      // Vérifier l'accès au parent
      if (user.user_type === 'client' && parentFolder.organization_id !== user.organization_id) {
        throw ApiError.forbidden('Cannot create subfolder in another organization');
      }

      // Si super_admin crée un sous-dossier, il peut spécifier l'org, sinon utiliser celle du parent
      if (user.role === 'super_admin' && data.organization_id) {
        organizationId = data.organization_id;
      } else {
        organizationId = parentFolder.organization_id;
      }
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
    if (!folder) throw ApiError.notFound('Folder');

    // Si on change le parent_id, vérifier que le nouveau parent existe et appartient à la même org
    if (data.parent_id !== undefined && data.parent_id !== folder.parent_id) {
      if (data.parent_id === null) {
        // Tenter de créer un dossier racine - seul super_admin peut
        if (user.role !== 'super_admin') {
          throw ApiError.forbidden('Only super_admin can convert folder to root');
        }
      } else {
        const newParent = await folderRepository.findById(data.parent_id);
        if (!newParent) {
          throw ApiError.notFound('Parent folder');
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
