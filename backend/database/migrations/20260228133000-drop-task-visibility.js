'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprime la colonne visibility si elle existe
    await queryInterface.removeColumn('tasks', 'visibility').catch(() => {});

    // Supprime le type enum associé s'il existe encore
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_tasks_visibility";')
      .catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    // Ré-ajoute la colonne visibility (au cas où on rollback)
    await queryInterface.addColumn('tasks', 'visibility', {
      type: Sequelize.ENUM('internal_only', 'client_visible'),
      allowNull: false,
      defaultValue: 'client_visible',
    });
  },
};

