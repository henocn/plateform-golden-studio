'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('proposals', 'task_id', {
      type: Sequelize.UUID,
      allowNull: true, // ou true selon votre logique métier
      references: {
        model: 'tasks', // Nom de la table des tâches
        key: 'id', // Clé primaire de la table des tâches
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // ou 'SET NULL' selon votre logique métier
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('proposals', 'task_id');
  },
};
