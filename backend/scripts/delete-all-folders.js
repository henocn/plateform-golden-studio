'use strict';

/**
 * Supprime tous les dossiers de la médiathèque (table folders).
 * Met d'abord à jour les médias pour mettre folder_id à null, puis supprime les dossiers.
 * Usage: depuis la racine backend: node scripts/delete-all-folders.js
 */

require('dotenv').config();

const { Media, Folder } = require('../src/models');

async function run() {
  try {
    const mediaUpdated = await Media.update(
      { folder_id: null },
      { where: {} }
    );
    console.log('Media: folder_id mis à null pour', mediaUpdated[0], 'ligne(s).');

    const deleted = await Folder.destroy({ where: {} });
    console.log('Dossiers supprimés:', deleted);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    await Folder.sequelize.close();
  }
}

run();
