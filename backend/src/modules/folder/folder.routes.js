'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const tenantMiddleware = require('../../middlewares/tenant.middleware');
const validate = require('../../middlewares/validate.middleware');
const folderController = require('./folder.controller');
const { createFolderSchema, updateFolderSchema, listFolderQuery } = require('./folder.validation');

const router = Router();

router.use(authenticate, tenantMiddleware);

// Liste des dossiers (avec filtres)
router.get('/',
  authorize('folders.view'),
  validate(listFolderQuery, 'query'),
  folderController.list);

// Dossiers racine d'une organisation
router.get('/roots/:organizationId',
  authorize('folders.view'),
  folderController.getRootFolders);

router.get('/roots',
  authorize('folders.view'),
  folderController.getRootFolders);

// Explorer un dossier (sous-dossiers + fichiers)
router.get('/:id/explore',
  authorize('folders.view'),
  folderController.explore);

// Récupérer un dossier par ID
router.get('/:id',
  authorize('folders.view'),
  folderController.getById);

// Créer un dossier (racine ou sous-dossier) — une seule permission pour tout
router.post('/',
  authorize('folders.create'),
  validate(createFolderSchema),
  folderController.create);

// Mettre à jour un dossier
router.put('/:id',
  authorize('folders.edit'),
  validate(updateFolderSchema),
  folderController.update);

// Supprimer un dossier
router.delete('/:id',
  authorize('folders.delete'),
  folderController.deleteFolder);

module.exports = router;
