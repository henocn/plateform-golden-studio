'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Supprimer d'abord les pièces jointes, puis les briefs
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "brief_attachments" CASCADE;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "briefs" CASCADE;');
  },

  async down() {
    // Pas de recréation automatique : les anciennes migrations de création restent disponibles si besoin
  },
};

